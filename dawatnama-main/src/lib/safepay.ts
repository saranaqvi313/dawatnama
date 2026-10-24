/**
 * Safepay card payments (Visa / Mastercard from any bank). Server-only.
 *
 * Flow, matching Safepay's official Node SDK and WooCommerce plugin:
 *  1. POST {api}/order/v1/init {amount, currency, client, environment} → a tracker token.
 *  2. Send the customer to {checkout}/pay?beacon=<token>&order_id=…&redirect_url=…&cancel_url=…
 *  3. After a successful payment Safepay POSTs tracker, sig, reference and order_id to
 *     redirect_url. sig = HMAC-SHA256(secret, tracker), hex.
 *  4. Webhooks (backup, in case the browser never returns): header x-sfpy-signature =
 *     HMAC-SHA512(webhook secret, JSON of body.data), hex.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const HOSTS = {
  sandbox: { api: 'https://sandbox.api.getsafepay.com', checkout: 'https://sandbox.api.getsafepay.com/checkout' },
  production: { api: 'https://api.getsafepay.com', checkout: 'https://getsafepay.com/checkout' },
} as const

export type SafepayConfig = { env: 'sandbox' | 'production'; api: string; checkout: string; apiKey: string; secret: string; webhookSecret: string }

/** Returns the config, or null if a required variable is missing. */
export function safepayConfig(): SafepayConfig | null {
  const env = process.env.SAFEPAY_ENV === 'production' ? 'production' : 'sandbox'
  const apiKey = process.env.SAFEPAY_API_KEY ?? ''
  const secret = process.env.SAFEPAY_SECRET_KEY ?? ''
  if (!apiKey || !secret) return null
  return { env, ...HOSTS[env], apiKey, secret, webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || secret }
}

/** Creates a payment for `amountPkr` rupees and returns Safepay's tracker token. */
export async function createTracker(c: SafepayConfig, amountPkr: number): Promise<string> {
  const res = await fetch(`${c.api}/order/v1/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPkr, currency: 'PKR', client: c.apiKey, environment: c.env }),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Safepay returned HTTP ${res.status}`)
  const body = (await res.json()) as { data?: { token?: string } }
  const token = body.data?.token
  if (!token || !/^[A-Za-z0-9_-]{6,100}$/.test(token)) throw new Error('Safepay did not return a payment token')
  return token
}

/** The hosted checkout page where the customer enters their card. */
export function checkoutUrl(c: SafepayConfig, o: { token: string; orderRef: string; redirectUrl: string; cancelUrl: string }): string {
  const params = new URLSearchParams({
    beacon: o.token,
    cancel_url: o.cancelUrl,
    env: c.env,
    order_id: o.orderRef,
    redirect_url: o.redirectUrl,
    source: 'custom',
    webhooks: 'true',
  })
  return `${c.checkout}/pay?${params.toString()}`
}

function safeEqualHex(a: string, b: string) {
  if (!/^[0-9a-f]+$/i.test(a) || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a.toLowerCase(), 'hex'), Buffer.from(b.toLowerCase(), 'hex'))
}

/** Checks the signature Safepay sends back with the customer after payment. */
export function verifyRedirectSignature(secret: string, tracker: string, sig: string): boolean {
  if (!tracker || !sig) return false
  return safeEqualHex(sig, createHmac('sha256', secret).update(tracker).digest('hex'))
}

/** Checks a webhook: x-sfpy-signature over JSON.stringify(body.data). */
export function verifyWebhookSignature(webhookSecret: string, data: unknown, sig: string | null): boolean {
  if (!sig || data === undefined) return false
  return safeEqualHex(sig, createHmac('sha512', webhookSecret).update(Buffer.from(JSON.stringify(data))).digest('hex'))
}
