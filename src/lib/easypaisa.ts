/**
 * Easypaisa (Easypay) merchant integration. Server-only: never import from a client component.
 *
 *  - Card:      hosted redirect. Index.jsf → our /return (auth_token) → Confirm.jsf → our /done.
 *  - Easypaisa: "Mobile Account" REST call. The customer approves on their phone; the call
 *               returns when they approve, decline or time out.
 *  - Every payment is confirmed with the Inquire Transaction API before Premium is granted.
 *    Nothing the browser sends back is trusted on its own.
 *
 * Reference: Easypaisa Merchant Integration Guide v4.1.2.
 */
import { createCipheriv } from 'node:crypto'

const HOSTS = {
  sandbox: 'https://easypaystg.easypaisa.com.pk',
  production: 'https://easypay.easypaisa.com.pk',
} as const

export type EasypaisaConfig = {
  host: string
  storeId: string
  hashKey: string
  accountNum: string
  username: string
  password: string
}

/** Returns the config, or null if any required variable is missing. */
export function easypaisaConfig(): EasypaisaConfig | null {
  const env = process.env.EASYPAISA_ENV === 'production' ? 'production' : 'sandbox'
  const c = {
    host: HOSTS[env],
    storeId: process.env.EASYPAISA_STORE_ID ?? '',
    hashKey: process.env.EASYPAISA_HASH_KEY ?? '',
    accountNum: process.env.EASYPAISA_ACCOUNT_NUM ?? '',
    username: process.env.EASYPAISA_USERNAME ?? '',
    password: process.env.EASYPAISA_PASSWORD ?? '',
  }
  return Object.values(c).every(Boolean) ? c : null
}

/** "1499" → "1499.0" (Easypay expects one decimal place). */
export const formatAmount = (pkr: number) => (Math.round(pkr * 10) / 10).toFixed(1)

/** "YYYYMMDD HHMMSS" in Pakistan time, `minutes` from now. */
export function expiryDate(minutes = 60, now = new Date()): string {
  const t = new Date(now.getTime() + minutes * 60_000 + 5 * 3600_000) // PKT = UTC+5, no DST
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())} ${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}`
}

/**
 * merchantHashedReq: fields sorted by name, joined as k=v&k=v, AES/ECB/PKCS5 with the
 * store's hash key (16/24/32 chars → AES-128/192/256), base64.
 */
export function merchantHash(fields: Record<string, string>, hashKey: string): string {
  const plain = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('&')
  const bits = Buffer.byteLength(hashKey) * 8
  if (![128, 192, 256].includes(bits)) throw new Error('EASYPAISA_HASH_KEY must be 16, 24 or 32 characters')
  const cipher = createCipheriv(`aes-${bits}-ecb`, Buffer.from(hashKey), null)
  return Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]).toString('base64')
}

/** Fields to POST to Index.jsf for a card payment. */
export function cardCheckoutFields(c: EasypaisaConfig, o: { orderRef: string; amountPkr: number; postBackURL: string; mobile?: string; email?: string }) {
  const fields: Record<string, string> = {
    amount: formatAmount(o.amountPkr),
    autoRedirect: '1',
    expiryDate: expiryDate(),
    orderRefNum: o.orderRef,
    paymentMethod: 'CC_PAYMENT_METHOD',
    postBackURL: o.postBackURL,
    storeId: c.storeId,
  }
  if (o.mobile) fields.mobileNum = o.mobile
  if (o.email) fields.emailAddr = o.email
  return { action: `${c.host}/easypay/Index.jsf`, fields: { ...fields, merchantHashedReq: merchantHash(fields, c.hashKey) } }
}

export const confirmUrl = (c: EasypaisaConfig) => `${c.host}/easypay/Confirm.jsf`

async function rest<T>(c: EasypaisaConfig, path: string, body: Record<string, string>, timeoutMs: number): Promise<T> {
  const res = await fetch(`${c.host}/easypay-service/rest/v4/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Credentials: Buffer.from(`${c.username}:${c.password}`).toString('base64'),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Easypaisa ${path} returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export type MaResult = { responseCode?: string; responseDesc?: string; transactionId?: string; orderId?: string }

/** Charges an Easypaisa mobile account. Waits while the customer approves on their phone. */
export function initiateMobileAccount(c: EasypaisaConfig, o: { orderRef: string; amountPkr: number; mobile: string; email?: string }) {
  return rest<MaResult>(c, 'initiate-ma-transaction', {
    orderId: o.orderRef,
    storeId: c.storeId,
    transactionAmount: formatAmount(o.amountPkr),
    transactionType: 'MA',
    mobileAccountNo: o.mobile,
    emailAddress: o.email || 'noreply@dawatnama.pk',
  }, 110_000)
}

export type InquiryResult = {
  responseCode?: string
  responseDesc?: string
  transactionStatus?: string // PAID, FAILED, PENDING, BLOCKED, EXPIRED, REVERSED
  transactionAmount?: string | number
  transactionId?: string
  paymentMode?: string
}

/** The source of truth for whether an order was paid. */
export function inquire(c: EasypaisaConfig, orderRef: string) {
  return rest<InquiryResult>(c, 'inquire-transaction', { orderId: orderRef, storeId: c.storeId, accountNum: c.accountNum }, 20_000)
}

/** 03001234567 format, which Easypaisa expects for mobile accounts. */
export function toLocalMobile(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  if (/^03\d{9}$/.test(d)) return d
  if (/^923\d{9}$/.test(d)) return `0${d.slice(2)}`
  if (/^3\d{9}$/.test(d)) return `0${d}`
  return null
}
