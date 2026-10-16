import assert from 'node:assert/strict'
import { createDecipheriv } from 'node:crypto'
import { test } from 'node:test'
import { createElement, MAX_ELEMENTS, MAX_TEXT, safeImageUrl, sanitizeCanvas } from '../src/lib/canvas'
import { CANVAS_TEMPLATES } from '../src/lib/canvasTemplates'
import { cardCheckoutFields, expiryDate, formatAmount, merchantHash, toLocalMobile } from '../src/lib/easypaisa'
import { normalizePhone, parseIdentity } from '../src/lib/identity'

test('Pakistani numbers normalise to E.164', () => {
  for (const v of ['03001234567', '0300 1234567', '0300-1234567', '3001234567', '923001234567', '+92 300 1234567', '00923001234567'])
    assert.equal(normalizePhone(v), '+923001234567', v)
  assert.equal(normalizePhone('+44 7700 900123'), '+447700900123')
  for (const v of ['0300123', '04212345678', '+92 42 1234567', 'hello', '']) assert.equal(normalizePhone(v), null, v)
})

test('identity: phone or email, phone only when enabled', () => {
  assert.deepEqual(parseIdentity('Me@Example.COM ', true), { kind: 'email', value: 'me@example.com', display: 'me@example.com' })
  assert.deepEqual(parseIdentity('0300 1234567', true), { kind: 'phone', value: '+923001234567', display: '0300 1234567' })
  assert.ok('error' in parseIdentity('0300 1234567', false))
  assert.ok('error' in parseIdentity('not-an-email@', true))
  assert.ok('error' in parseIdentity('', true))
})

test('easypaisa: amount, expiry and mobile formats', () => {
  assert.equal(formatAmount(1499), '1499.0')
  assert.equal(expiryDate(60, new Date('2026-10-16T03:00:00Z')), '20261016 090000') // 03:00 UTC + 5h + 1h
  assert.equal(toLocalMobile('+923451234567'), '03451234567')
  assert.equal(toLocalMobile('0345 1234567'), '03451234567')
  assert.equal(toLocalMobile('12345'), null)
})

test('easypaisa: merchantHashedReq is AES-ECB over sorted fields, base64', () => {
  const key = '0123456789ABCDEF'
  const fields = { storeId: '43', amount: '10.0', postBackURL: 'https://x.pk/r', orderRefNum: 'DN1', autoRedirect: '1' }
  const hash = merchantHash(fields, key)
  const d = createDecipheriv('aes-128-ecb', Buffer.from(key), null)
  const plain = Buffer.concat([d.update(Buffer.from(hash, 'base64')), d.final()]).toString()
  assert.equal(plain, 'amount=10.0&autoRedirect=1&orderRefNum=DN1&postBackURL=https://x.pk/r&storeId=43')
  assert.throws(() => merchantHash(fields, 'short'))
})

test('easypaisa: card checkout fields include a hash of everything else', () => {
  const c = { host: 'https://easypaystg.easypaisa.com.pk', storeId: '43', hashKey: '0123456789ABCDEF', accountNum: '1', username: 'u', password: 'p' }
  const { action, fields } = cardCheckoutFields(c, { orderRef: 'DNABC123', amountPkr: 1499, postBackURL: 'https://site/api/pay/card/return?order=DNABC123' })
  assert.equal(action, 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf')
  assert.equal(fields.paymentMethod, 'CC_PAYMENT_METHOD')
  assert.equal(fields.amount, '1499.0')
  const { merchantHashedReq, ...rest } = fields
  assert.equal(merchantHashedReq, merchantHash(rest, c.hashKey))
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

test('payments: only a full PAID amount grants Premium', async () => {
  const { decideOutcome } = await import('../src/lib/payments')
  assert.equal(decideOutcome({ transactionStatus: 'PAID', transactionAmount: '1499.0' }, 1499), 'paid')
  assert.equal(decideOutcome({ transactionStatus: 'paid', transactionAmount: 1499 }, 1499), 'paid')
  assert.equal(decideOutcome({ transactionStatus: 'PAID', transactionAmount: '1.0' }, 1499), 'failed', 'underpaid')
  assert.equal(decideOutcome({ transactionStatus: 'PAID' }, 1499), 'failed', 'amount missing')
  assert.equal(decideOutcome({ transactionStatus: 'PENDING', transactionAmount: '1499.0' }, 1499), 'pending')
  assert.equal(decideOutcome({}, 1499), 'pending')
  for (const s of ['FAILED', 'EXPIRED', 'BLOCKED', 'REVERSED']) assert.equal(decideOutcome({ transactionStatus: s }, 1499), 'failed', s)
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
