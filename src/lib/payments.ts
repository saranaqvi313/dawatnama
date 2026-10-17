/** Payment bookkeeping shared by the payment routes. Server-only. */
import { randomBytes } from 'node:crypto'
import { PRODUCTS, serverPriceOf, type ProductId } from './pricing'
import { safepayConfig } from './safepay'
import { createAdminClient } from './supabase/admin'

export type PaymentMethod = 'card' | 'demo'
/** 'premium' unlocks design for the account; 'share' unlocks one card's share link. */
export type PaymentPurpose = 'premium' | 'share' | 'credits' | 'package'
export const isCardId = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

/**
 * "card": real card payments through Safepay.
 * "demo": a test checkout without a Safepay account. Never runs on Vercel's production
 *         deployment, whatever PAYMENT_MODE says.
 */
export function paymentMode(): 'card' | 'demo' | 'off' {
  if (process.env.PAYMENT_MODE === 'demo' && process.env.VERCEL_ENV !== 'production') return 'demo'
  if (safepayConfig() && process.env.SUPABASE_SERVICE_ROLE_KEY) return 'card'
  return 'off'
}

export function newOrderRef(): string {
  return `DN${Date.now().toString(36).toUpperCase()}${randomBytes(4).toString('hex').toUpperCase()}`
}

export const isOrderRef = (v: string) => /^[A-Za-z0-9]{6,30}$/.test(v)

/** Records a pending payment. `tracker` is Safepay's token for this exact amount. */
export async function createPendingPayment(
  userId: string, method: PaymentMethod,
  opts: { orderRef?: string; tracker?: string; product?: ProductId; returnPath?: string } = {},
) {
  const orderRef = opts.orderRef ?? newOrderRef()
  const product = PRODUCTS[opts.product ?? 'premium']
  const purpose: PaymentPurpose = product.premium && product.credits > 0 ? 'package' : product.credits > 0 ? 'credits' : 'premium'
  const amountPkr = serverPriceOf(product.id)
  const { error } = await createAdminClient().from('payments').insert({
    user_id: userId, order_ref: orderRef, method, amount_pkr: amountPkr, gateway_ref: opts.tracker ?? null,
    purpose, credits: product.credits, product: product.id, return_path: safeReturn(opts.returnPath),
  })
  if (error) throw new Error(`Could not record payment: ${error.message}`)
  return { orderRef, amountPkr }
}

/** Only same-site paths, e.g. /dashboard/123/guests. */
export function safeReturn(path: string | null | undefined): string | null {
  return path && /^\/[^/\\]/.test(path) && path.length <= 200 && !/[\s<>"]/.test(path) ? path : null
}

export function withResult(path: string, result: string) {
  return `${path}${path.includes('?') ? '&' : '?'}pay=${encodeURIComponent(result)}`
}

/**
 * Switches Premium on for a verified payment. The tracker must be the one we created for
 * this order (so a valid signature for some other payment can't be reused here).
 * Safe to call more than once (redirect and webhook may both arrive).
 */
export async function completeVerifiedPayment(orderRef: string, tracker: string, source: string): Promise<boolean> {
  if (!isOrderRef(orderRef) || !tracker) return false
  const admin = createAdminClient()
  const { data: payment } = await admin.from('payments')
    .select('status, gateway_ref, method').eq('order_ref', orderRef).maybeSingle()
  if (!payment || payment.gateway_ref !== tracker) return false
  if (payment.status === 'paid') return true
  const { data, error } = await admin.rpc('complete_payment', { p_order_ref: orderRef, p_gateway_ref: tracker, p_gateway_status: source })
  if (error) throw new Error(`Could not complete payment: ${error.message}`)
  return data === true
}

/** Page to return to after a payment: where the customer started, or the plans page. */
export async function returnPathFor(orderRef: string, result: string): Promise<string> {
  if (isOrderRef(orderRef)) {
    const { data } = await createAdminClient().from('payments').select('purpose, invitation_id, return_path').eq('order_ref', orderRef).maybeSingle()
    if (data?.return_path) return withResult(data.return_path, result)
    if (data?.purpose === 'share' && data.invitation_id) return withResult(`/dashboard/${data.invitation_id}`, result)
  }
  return `/premium?result=${result}`
}

/** Finds the order that a Safepay tracker belongs to (used by webhooks). */
export async function orderForTracker(tracker: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{6,100}$/.test(tracker)) return null
  const { data } = await createAdminClient().from('payments').select('order_ref').eq('gateway_ref', tracker).maybeSingle()
  return data?.order_ref ?? null
}

/**
 * Where to send the visitor back to: always the address they are on now, so they stay signed in
 * (cookies belong to one address). NEXT_PUBLIC_SITE_URL is only a fallback.
 */
export function siteUrl(requestOrigin: string) {
  return (requestOrigin || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
}

/** Rejects cross-site form posts to our own endpoints (defence in depth on top of SameSite cookies). */
export function sameOrigin(request: Request, site: string) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).host === new URL(site).host || new URL(origin).host === new URL(request.url).host } catch { return false }
}
