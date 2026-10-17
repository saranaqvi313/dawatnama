import { NextResponse, type NextRequest } from 'next/server'
import { completeVerifiedPayment, createPendingPayment, newOrderRef, paymentMode, safeReturn, sameOrigin, siteUrl, withResult } from '@/lib/payments'
import { isProductId } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** Test checkout (PAYMENT_MODE=demo, never on the production deployment). No money moves. */
export async function POST(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  if (paymentMode() !== 'demo' || !sameOrigin(request, site)) return new NextResponse('Not available', { status: 404 })
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.redirect(`${site}/login?next=/premium`, 303)
  const form = await request.formData()
  const raw = String(form.get('product') ?? '')
  const product = isProductId(raw) ? raw : 'premium'
  const returnPath = safeReturn(String(form.get('return') ?? ''))
  const back = (result: string) => NextResponse.redirect(`${site}${returnPath ? withResult(returnPath, result) : `/premium?result=${result}`}`, 303)
  if (form.get('outcome') !== 'pay') return back('failed')
  const orderRef = newOrderRef()
  const tracker = `demo-${orderRef}`
  await createPendingPayment(data.user.id, 'demo', { orderRef, tracker, product, returnPath: returnPath ?? undefined })
  const ok = await completeVerifiedPayment(orderRef, tracker, 'DEMO_PAID')
  return back(ok ? 'paid' : 'failed')
}
