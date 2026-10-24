import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement, MAX_ELEMENTS, MAX_TEXT, safeImageUrl, sanitizeCanvas } from '../src/lib/canvas'
import { CANVAS_TEMPLATES } from '../src/lib/canvasTemplates'
import { checkoutUrl, verifyRedirectSignature, verifyWebhookSignature } from '../src/lib/safepay'
import { createHmac } from 'node:crypto'
import { normalizePhone, parsePhone, safeNext } from '../src/lib/identity'
import { isPossibleSlug, slugProblem, toSlug } from '../src/lib/slug'
import { accountEmail, accountPassword, ensureAccount } from '../src/lib/phoneAccount'

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

test('number sign-in: one stable internal account per number', () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  assert.equal(accountEmail('+923001234567'), 'p923001234567@phone.dawatnama.app')
  const a = accountPassword('+923001234567')
  assert.equal(a, accountPassword('+923001234567'), 'same number, same password')
  assert.notEqual(a, accountPassword('+923001234568'), 'different number, different password')
  assert.match(a, /^Dw#[0-9a-f]{64}Z9$/)
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'rotated'
  assert.notEqual(a, accountPassword('+923001234567'), 'derived from the server secret')
})

test('number sign-in: new number creates an account, known number is re-synced', async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  const calls: string[] = []
  const users = [{ id: 'u-old', email: undefined, phone: '923001234567', user_metadata: { full_name: 'Sara' } }]
  const fake = (exists: boolean) => ({ auth: { admin: {
    createUser: async (a: { email: string }) => { calls.push('create ' + a.email); return { error: exists ? { message: 'Phone number already registered' } : null } },
    listUsers: async () => ({ data: { users }, error: null }),
    updateUserById: async (id: string, a: { email: string; user_metadata: object }) => { calls.push(`update ${id} ${a.email} ${JSON.stringify(a.user_metadata)}`); return { error: null } },
  } } }) as never
  const fresh = await ensureAccount(fake(false), '+923007654321', 'Ali')
  assert.deepEqual(fresh, { email: 'p923007654321@phone.dawatnama.app', password: accountPassword('+923007654321') })
  assert.deepEqual(calls, ['create p923007654321@phone.dawatnama.app'])
  calls.length = 0
  await ensureAccount(fake(true), '+923001234567')
  assert.equal(calls[1], 'update u-old p923001234567@phone.dawatnama.app {"full_name":"Sara","phone":"+923001234567"}')
})

test('after sign-in, only same-site paths are followed', () => {
  assert.equal(safeNext('/design/abc'), '/design/abc')
  assert.equal(safeNext('//evil.com'), '/dashboard')
  assert.equal(safeNext('https://evil.com'), '/dashboard')
  assert.equal(safeNext('/\\evil.com'), '/dashboard')
  assert.equal(safeNext(undefined), '/dashboard')
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

test('card links: your-site.com/<guest-name>', () => {
  assert.equal(toSlug('Ali Khan'), 'ali-khan')
  assert.equal(toSlug('  Ayesha & Ali!! '), 'ayesha-and-ali')
  assert.equal(toSlug('Zoë  Ahmed--Family'), 'zoe-ahmed-family')
  assert.equal(toSlug('علی'), '')
  assert.equal(slugProblem('ali-khan'), '')
  assert.match(slugProblem('al'), /at least/)
  assert.match(slugProblem('dashboard'), /used by the website/)
  assert.match(slugProblem('ali_khan'), /English letters/)
  assert.ok(isPossibleSlug('ali-khan-x1'))
  assert.ok(!isPossibleSlug('favicon.ico'))
  assert.ok(!isPossibleSlug('templates'))
})

import { parseCsv, rowsToGuests } from '../src/lib/sheet'
import { guestStats, replySummary, whatsappHref, type GuestRow } from '../src/lib/guestStats'
import { videoEmbed } from '../src/lib/media'
import { PRODUCTS, serverPriceOf } from '../src/lib/pricing'
import { hashCode, newCode } from '../src/lib/otp'
import { safeReturn, withResult } from '../src/lib/payments'

test('guest list upload: CSV with headers in any order', () => {
  const rows = parseCsv('﻿Phone,Full Name,Guests,Events\r\n0300 1234567,"Khan, Ali",3,"Mehndi, Baraat"\r\n,Hina,,\r\n')
  assert.deepEqual(rowsToGuests(rows), [
    { name: 'Khan, Ali', phone: '0300 1234567', party_size: 3, events: ['Mehndi', 'Baraat'] },
    { name: 'Hina', phone: '', party_size: 1, events: [] },
  ])
  // no header row: A = name, B = phone, C = people; semicolons (Excel in some locales) work too
  assert.deepEqual(rowsToGuests(parseCsv('Ali;03001234567;2\nSara;;\n')).map((g) => [g.name, g.party_size]), [['Ali', 2], ['Sara', 1]])
})

test('guest dashboard: food headcount per function and who opened', () => {
  const g = (id: string, events: string[], live = true, opens = 0): GuestRow => ({ id, name: id, phone: null, slug: id, party_size: 3, events, link_active: live, open_count: opens, opened_at: null, last_opened_at: null, reminded_at: null })
  const guests = [g('a', []), g('b', ['Mehndi'], true, 2), g('c', ['Baraat'], false)]
  const replies = [
    { guest_id: 'a', event_name: 'Mehndi', attending: 'yes' as const, guests: 3 },
    { guest_id: 'a', event_name: 'Baraat', attending: 'no' as const, guests: 0 },
    { guest_id: null, event_name: 'Mehndi', attending: 'yes' as const, guests: 2 },
  ]
  const s = guestStats(guests, replies, ['Mehndi', 'Baraat'])
  assert.equal(s.live, 2); assert.equal(s.opened, 1); assert.equal(s.replied, 1); assert.equal(s.people, 9)
  assert.deepEqual(s.perEvent.map((e) => [e.event, e.coming, e.declined, e.waiting]), [['Mehndi', 5, 0, 1], ['Baraat', 0, 1, 0]])
  assert.equal(replySummary('a', replies), 'Mehndi: coming (3) · Baraat: can\'t come')
  assert.equal(whatsappHref('+92 300 1234567', 'Hi & bye'), 'https://wa.me/923001234567?text=Hi%20%26%20bye')
})

test('video links: YouTube, Vimeo, uploaded files; nothing else', () => {
  assert.equal(videoEmbed('https://youtu.be/dQw4w9WgXcQ')?.src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0')
  assert.equal(videoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3')?.kind, 'iframe')
  assert.equal(videoEmbed('https://youtube.com/shorts/abcDEF12345')?.src, 'https://www.youtube-nocookie.com/embed/abcDEF12345?rel=0')
  assert.equal(videoEmbed('https://vimeo.com/123456789')?.src, 'https://player.vimeo.com/video/123456789')
  assert.equal(videoEmbed('https://x.supabase.co/storage/v1/object/public/photos/u/v.mp4')?.kind, 'file')
  assert.equal(videoEmbed('http://youtu.be/dQw4w9WgXcQ'), null)
  assert.equal(videoEmbed('javascript:alert(1)'), null)
  assert.equal(videoEmbed('https://evil.example/page'), null)
})

test('prices: bundles are cheaper per link and the server decides the amount', () => {
  assert.equal(PRODUCTS.links1.price, 100)
  assert.ok(PRODUCTS.links5.price / PRODUCTS.links5.credits < PRODUCTS.links1.price)
  assert.ok(PRODUCTS.links20.price / PRODUCTS.links20.credits < PRODUCTS.links5.price / PRODUCTS.links5.credits)
  assert.ok(PRODUCTS.shaadi.price < PRODUCTS.premium.price + PRODUCTS.links1.price * PRODUCTS.shaadi.credits)
  assert.equal(serverPriceOf('premium'), 1499)
})

test('sign-in codes: 6 digits, hashed per number, never stored plain', () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  for (let i = 0; i < 50; i++) assert.match(newCode(), /^\d{6}$/)
  assert.equal(hashCode('+923001234567', '123456'), hashCode('+923001234567', '123456'))
  assert.notEqual(hashCode('+923001234567', '123456'), hashCode('+923001234568', '123456'))
  assert.ok(!hashCode('+923001234567', '123456').includes('123456'))
})

test('after paying, only same-site return paths are used', () => {
  assert.equal(safeReturn('/dashboard/abc/guests'), '/dashboard/abc/guests')
  assert.equal(safeReturn('//evil.com'), null)
  assert.equal(safeReturn('https://evil.com'), null)
  assert.equal(safeReturn('/\\evil.com'), null)
  assert.equal(withResult('/dashboard/abc', 'paid'), '/dashboard/abc?pay=paid')
  assert.equal(withResult('/x?y=1', 'paid'), '/x?y=1&pay=paid')
})

import { passwordProblem } from '../src/lib/password'
import { signInWithPhonePassword } from '../src/lib/passwordAuth'

test('password rules: 10+ characters with a letter, a number and a special character', () => {
  assert.equal(passwordProblem('Shaadi#2026'), '')
  assert.equal(passwordProblem('abc!12345x'), '')
  assert.match(passwordProblem('Short#1'), /at least 10/)
  assert.match(passwordProblem('NoNumbers!!!'), /a number/)
  assert.match(passwordProblem('nospecial123'), /special/)
  assert.match(passwordProblem('1234567890!'), /a letter/)
  assert.match(passwordProblem('x'.repeat(70) + '1!!'), /at most 72/)
})

test('number + password sign-in: new account, old number-only account, wrong password', async () => {
  type U = { id: string; email: string; phone: string; user_metadata: Record<string, unknown>; password: string }
  const users: U[] = []
  const session = { auth: { signInWithPassword: async ({ email, password }: { email: string; password: string }) =>
    ({ error: users.some((u) => u.email === email && u.password === password) ? null : { message: 'Invalid login credentials' } }) } }
  const admin = { auth: { admin: {
    listUsers: async () => ({ data: { users }, error: null }),
    createUser: async (a: { email: string; password: string; phone: string; user_metadata: Record<string, unknown> }) => { users.push({ id: `u${users.length}`, email: a.email, phone: a.phone.replace('+', ''), user_metadata: a.user_metadata, password: a.password }); return { error: null } },
    updateUserById: async (id: string, a: { password: string; user_metadata: Record<string, unknown> }) => { const u = users.find((x) => x.id === id)!; u.password = a.password; u.user_metadata = a.user_metadata; return { error: null } },
  } } }
  const go = (phone: string, pw: string) => signInWithPhonePassword(admin as never, session as never, phone, pw)

  assert.deepEqual(await go('+923001111111', 'weak'), { ok: false, status: 400, error: 'Your password needs: at least 10 characters, a number (0–9), a special character (e.g. ! @ # $ %).' })
  assert.deepEqual(await go('+923001111111', 'Shaadi#2026'), { ok: true, created: true, claimed: false })
  assert.deepEqual(await go('+923001111111', 'Shaadi#2026'), { ok: true, created: false, claimed: false })
  const wrong = await go('+923001111111', 'Wrong#Pass99')
  assert.equal(wrong.ok, false); assert.equal((wrong as { status: number }).status, 401)

  // an account made before passwords existed: the first strong password becomes its password
  users.push({ id: 'old', email: 'p923002222222@phone.dawatnama.app', phone: '923002222222', user_metadata: { phone: '+923002222222' }, password: 'derived' })
  assert.deepEqual(await go('+923002222222', 'Mehndi@Night1'), { ok: true, created: false, claimed: true })
  assert.equal(users.find((u) => u.id === 'old')!.user_metadata.password_set, true)
  assert.equal((await go('+923002222222', 'Other@Night1')).ok, false)
})
