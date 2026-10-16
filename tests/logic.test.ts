import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement, MAX_ELEMENTS, MAX_TEXT, safeImageUrl, sanitizeCanvas } from '../src/lib/canvas'
import { CANVAS_TEMPLATES } from '../src/lib/canvasTemplates'
import { checkoutUrl, verifyRedirectSignature, verifyWebhookSignature } from '../src/lib/safepay'
import { createHmac } from 'node:crypto'
import { normalizePhone, parsePhone } from '../src/lib/identity'

test('Pakistani numbers normalise to E.164', () => {
  for (const v of ['03001234567', '0300 1234567', '0300-1234567', '3001234567', '923001234567', '+92 300 1234567', '00923001234567'])
    assert.equal(normalizePhone(v), '+923001234567', v)
  assert.equal(normalizePhone('+44 7700 900123'), '+447700900123')
  for (const v of ['0300123', '04212345678', '+92 42 1234567', 'hello', '']) assert.equal(normalizePhone(v), null, v)
})

test('sign-in accepts mobile numbers only', () => {
  assert.deepEqual(parsePhone('0300 1234567'), { value: '+923001234567', display: '0300 1234567' })
  assert.deepEqual(parsePhone('+92 345 7654321'), { value: '+923457654321', display: '0345 7654321' })
  assert.ok('error' in parsePhone('me@example.com'), 'email rejected')
  assert.ok('error' in parsePhone('12345'))
  assert.ok('error' in parsePhone(''))
})

test('safepay: checkout URL carries the tracker, order and return URLs', () => {
  const c = { env: 'sandbox' as const, api: 'https://sandbox.api.getsafepay.com', checkout: 'https://sandbox.api.getsafepay.com/checkout', apiKey: 'sec_x', secret: 's', webhookSecret: 'w' }
  const url = new URL(checkoutUrl(c, { token: 'track_123abc', orderRef: 'DNABC123', redirectUrl: 'https://site/api/pay/card/done', cancelUrl: 'https://site/premium?result=cancelled' }))
  assert.equal(url.origin + url.pathname, 'https://sandbox.api.getsafepay.com/checkout/pay')
  assert.equal(url.searchParams.get('beacon'), 'track_123abc')
  assert.equal(url.searchParams.get('order_id'), 'DNABC123')
  assert.equal(url.searchParams.get('env'), 'sandbox')
  assert.equal(url.searchParams.get('redirect_url'), 'https://site/api/pay/card/done')
  assert.equal(url.searchParams.get('cancel_url'), 'https://site/premium?result=cancelled')
})

test('safepay: redirect signature is HMAC-SHA256(secret, tracker)', () => {
  const sig = createHmac('sha256', 'shh').update('track_123abc').digest('hex')
  assert.ok(verifyRedirectSignature('shh', 'track_123abc', sig))
  assert.ok(verifyRedirectSignature('shh', 'track_123abc', sig.toUpperCase()))
  assert.ok(!verifyRedirectSignature('shh', 'track_OTHER', sig), 'signature is bound to the tracker')
  assert.ok(!verifyRedirectSignature('wrong', 'track_123abc', sig), 'wrong secret')
  assert.ok(!verifyRedirectSignature('shh', 'track_123abc', ''), 'missing signature')
  assert.ok(!verifyRedirectSignature('shh', 'track_123abc', 'zz' + sig.slice(2)), 'non-hex')
})

test('safepay: webhook signature is HMAC-SHA512 over the JSON of body.data', () => {
  const data = { tracker: { token: 'track_123abc' }, state: 'PAID' }
  const sig = createHmac('sha512', 'wh').update(Buffer.from(JSON.stringify(data))).digest('hex')
  assert.ok(verifyWebhookSignature('wh', data, sig))
  assert.ok(!verifyWebhookSignature('wh', { ...data, state: 'FAILED' }, sig), 'tampered payload')
  assert.ok(!verifyWebhookSignature('wh', data, null))
})

test('canvas: sanitizer rejects unsafe values', () => {
  const doc = sanitizeCanvas({
    bg: { color: 'red;background:url(x)', pattern: 'evil', image: 'javascript:alert(1)' },
    elements: [
      { type: 'text', id: 'a', text: 'x'.repeat(5000), color: 'url(http://x)', font: 'comic', size: 9999, weight: 900 },
      { type: 'image', id: 'b', src: 'http://insecure.example/x.png' },
      { type: 'image', id: 'c', src: 'https://abc.supabase.co/storage/v1/object/public/photos/u/x.png' },
      { type: 'script', id: 'd' },
      { type: 'text', id: 'a', text: 'dup id' },
    ],
  })
  assert.equal(doc.bg.color, '#fbf6ea')
  assert.equal(doc.bg.pattern, 'none')
  assert.equal(doc.bg.image, '')
  const [t, img1, img2, dup] = doc.elements
  assert.equal(doc.elements.length, 4, 'unknown element type dropped')
  assert.ok(t.type === 'text' && t.text.length === MAX_TEXT && t.color === '#222222' && t.font === 'playfair' && t.size === 160 && t.weight === 400)
  assert.ok(img1.type === 'image' && img1.src === '')
  assert.ok(img2.type === 'image' && img2.src.startsWith('https://'))
  assert.notEqual(dup.id, t.id, 'duplicate ids are made unique')
  assert.equal(sanitizeCanvas({ elements: Array.from({ length: 500 }, () => ({ type: 'shape' })) }).elements.length, MAX_ELEMENTS)
  assert.equal(sanitizeCanvas(null).elements.length, 0)
  assert.equal(safeImageUrl('//evil.com/x.png'), '')
  assert.equal(safeImageUrl('/local.png'), '/local.png')
})

test('canvas: templates survive the sanitizer unchanged and new elements are valid', () => {
  for (const t of CANVAS_TEMPLATES) {
    assert.deepEqual(sanitizeCanvas(t.doc), t.doc, t.id)
    assert.ok(t.doc.elements.length >= 8, `${t.id} has content`)
    assert.ok(!JSON.stringify(t.doc).match(/Ayesha|Ali|Ahmed|Fatima/), 'no sample names')
  }
  for (const k of ['heading', 'text', 'script', 'image', 'shape:rect', 'shape:arch', 'ornament:mandala'] as const) {
    const el = createElement(k)
    assert.deepEqual(sanitizeCanvas({ elements: [el] }).elements[0], el, k)
  }
})

test('payments: demo mode is impossible on the production deployment', async () => {
  const { paymentMode } = await import('../src/lib/payments')
  const env = { ...process.env }
  process.env.PAYMENT_MODE = 'demo'
  process.env.VERCEL_ENV = 'production'
  assert.notEqual(paymentMode(), 'demo')
  process.env.VERCEL_ENV = 'preview'
  assert.equal(paymentMode(), 'demo')
  process.env = env
})
