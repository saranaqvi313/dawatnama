import { NextResponse, type NextRequest } from 'next/server'
import { cardPath, completeVerifiedPayment, createPendingPayment, isCardId, newOrderRef, paymentMode, sameOrigin, siteUrl } from '@/lib/payments'
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
  const invitationId = String(form.get('invitation') ?? '')
  const share = form.get('for') === 'share' && isCardId(invitationId)
  const back = (result: string) => NextResponse.redirect(`${site}${share ? cardPath(invitationId, result) : `/premium?result=${result}`}`, 303)
  if (form.get('outcome') !== 'pay') return back('failed')
  if (share) {
    const { data: card } = await supabase.from('invitations').select('id').eq('id', invitationId).eq('user_id', data.user.id).maybeSingle()
    if (!card) return NextResponse.redirect(`${site}/dashboard`, 303)
  }
  const orderRef = newOrderRef()
  const tracker = `demo-${orderRef}`
  await createPendingPayment(data.user.id, 'demo', { orderRef, tracker, purpose: share ? 'share' : 'premium', invitationId: share ? invitationId : undefined })
  const ok = await completeVerifiedPayment(orderRef, tracker, 'DEMO_PAID')
  return back(ok ? 'paid' : 'failed')
}
