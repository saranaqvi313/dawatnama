import { NextResponse, type NextRequest } from 'next/server'
import { createPendingPayment, paymentMode, sameOrigin, siteUrl, verifyAndComplete } from '@/lib/payments'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** Test checkout (PAYMENT_MODE=demo, never on the production deployment). No money moves. */
export async function POST(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  if (paymentMode() !== 'demo' || !sameOrigin(request, site)) return new NextResponse('Not available', { status: 404 })
  const { data } = await (await createClient()).auth.getUser()
  if (!data.user) return NextResponse.redirect(`${site}/login?next=/premium`, 303)
  const form = await request.formData()
  if (form.get('outcome') !== 'pay') return NextResponse.redirect(`${site}/premium?result=failed`, 303)
  const { orderRef } = await createPendingPayment(data.user.id, 'demo')
  const outcome = await verifyAndComplete(orderRef)
  return NextResponse.redirect(`${site}/premium?result=${outcome}`, 303)
}
