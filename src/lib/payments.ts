/** Payment bookkeeping shared by the payment routes. Server-only. */
import { randomBytes } from 'node:crypto'
import { easypaisaConfig, inquire } from './easypaisa'
import { serverPrice } from './pricing'
import { createAdminClient } from './supabase/admin'

export type PaymentMethod = 'card' | 'easypaisa' | 'demo'
export type PaymentOutcome = 'paid' | 'pending' | 'failed'

/**
 * "demo" lets you try the whole flow without an Easypaisa merchant account. It never runs
 * on Vercel's production deployment, whatever PAYMENT_MODE says.
 */
export function paymentMode(): 'easypaisa' | 'demo' | 'off' {
  const demoAllowed = process.env.PAYMENT_MODE === 'demo' && process.env.VERCEL_ENV !== 'production'
  if (demoAllowed) return 'demo'
  if (easypaisaConfig() && process.env.SUPABASE_SERVICE_ROLE_KEY) return 'easypaisa'
  return 'off'
}

export function newOrderRef(): string {
  return `DN${Date.now().toString(36).toUpperCase()}${randomBytes(4).toString('hex').toUpperCase()}`
}

export async function createPendingPayment(userId: string, method: PaymentMethod) {
  const orderRef = newOrderRef()
  const amountPkr = serverPrice()
  const { error } = await createAdminClient().from('payments')
    .insert({ user_id: userId, order_ref: orderRef, method, amount_pkr: amountPkr })
  if (error) throw new Error(`Could not record payment: ${error.message}`)
  return { orderRef, amountPkr }
}

async function markFailed(orderRef: string, gatewayStatus: string) {
  await createAdminClient().from('payments')
    .update({ status: 'failed', gateway_status: gatewayStatus.slice(0, 60) })
    .eq('order_ref', orderRef).eq('status', 'pending')
}

/**
 * Asks Easypaisa whether the order was paid, checks the amount, and switches Premium on.
 * Safe to call repeatedly and from several places (return URL, IPN, wallet call).
 */
export async function verifyAndComplete(orderRef: string): Promise<PaymentOutcome> {
  if (!/^[A-Za-z0-9]{6,30}$/.test(orderRef)) return 'failed'
  const admin = createAdminClient()
  const { data: payment } = await admin.from('payments')
    .select('status, amount_pkr, method').eq('order_ref', orderRef).maybeSingle()
  if (!payment) return 'failed'
  if (payment.status === 'paid') return 'paid'

  if (payment.method === 'demo') {
    if (paymentMode() !== 'demo') return 'failed'
    return (await complete(orderRef, 'DEMO', 'DEMO_PAID')) ? 'paid' : 'failed'
  }

  const config = easypaisaConfig()
  if (!config) return 'pending'
  let result
  try {
    result = await inquire(config, orderRef)
  } catch {
    return 'pending' // gateway unreachable: try again later (IPN or a page refresh)
  }
  const decision = decideOutcome(result, payment.amount_pkr)
  const status = String(result.transactionStatus ?? '').toUpperCase()
  if (decision === 'paid') return (await complete(orderRef, String(result.transactionId ?? ''), status)) ? 'paid' : 'failed'
  if (decision === 'failed') await markFailed(orderRef, status || 'UNKNOWN')
  return decision
}

/** Maps Easypaisa's inquiry answer to our outcome. Paid only if PAID and the full amount arrived. */
export function decideOutcome(result: { transactionStatus?: string; transactionAmount?: string | number }, expectedPkr: number): PaymentOutcome {
  const status = String(result.transactionStatus ?? '').toUpperCase()
  const paidAmount = Number(result.transactionAmount)
  if (status === 'PAID') return Number.isFinite(paidAmount) && paidAmount + 0.001 >= expectedPkr ? 'paid' : 'failed'
  if (['FAILED', 'EXPIRED', 'BLOCKED', 'REVERSED'].includes(status)) return 'failed'
  return 'pending'
}

async function complete(orderRef: string, gatewayRef: string, gatewayStatus: string) {
  const { data, error } = await createAdminClient()
    .rpc('complete_payment', { p_order_ref: orderRef, p_gateway_ref: gatewayRef, p_gateway_status: gatewayStatus })
  if (error) throw new Error(`Could not complete payment: ${error.message}`)
  return data === true
}

export { markFailed }

export function siteUrl(requestOrigin: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL || requestOrigin).replace(/\/+$/, '')
}

/** Rejects cross-site form posts (defence in depth on top of SameSite cookies). */
export function sameOrigin(request: Request, site: string) {
  const origin = request.headers.get('origin')
  if (!origin) return true // some browsers omit Origin on same-origin form posts
  try { return new URL(origin).host === new URL(site).host || new URL(origin).host === new URL(request.url).host } catch { return false }
}
