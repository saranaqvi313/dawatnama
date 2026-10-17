import { NextResponse, type NextRequest } from 'next/server'
import { cardPath, createPendingPayment, isCardId, newOrderRef, paymentMode, sameOrigin, siteUrl, type PaymentPurpose } from '@/lib/payments'
import { isPremium } from '@/lib/premium'
import { serverPrice, serverSharePrice } from '@/lib/pricing'
import { checkoutUrl, createTracker, safepayConfig } from '@/lib/safepay'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Starts a card payment: creates the Safepay payment, records it, sends the customer to Safepay.
 * Form fields: purpose = 'premium' (default) or 'share' with invitation = the card's id.
 */
export async function POST(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  if (!sameOrigin(request, site)) return new NextResponse('Forbidden', { status: 403 })
  const form = await request.formData().catch(() => null)
  const purpose: PaymentPurpose = form?.get('purpose') === 'share' ? 'share' : 'premium'
  const invitationId = String(form?.get('invitation') ?? '')
  const back = (result: string) =>
    NextResponse.redirect(`${site}${purpose === 'share' && isCardId(invitationId) ? cardPath(invitationId, result) : `/premium?result=${result}`}`, 303)

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return NextResponse.redirect(`${site}/login?next=${encodeURIComponent(purpose === 'share' && isCardId(invitationId) ? `/dashboard/${invitationId}` : '/premium')}`, 303)

  if (purpose === 'share') {
    if (!isCardId(invitationId)) return NextResponse.redirect(`${site}/dashboard`, 303)
    const { data: card } = await supabase.from('invitations').select('id, share_paid').eq('id', invitationId).eq('user_id', user.id).maybeSingle()
    if (!card) return NextResponse.redirect(`${site}/dashboard`, 303)
    if (card.share_paid) return back('paid')
  } else if (await isPremium(supabase, user.id)) {
    return back('paid')
  }

  const mode = paymentMode()
  if (mode === 'demo') {
    const q = purpose === 'share' ? `?for=share&invitation=${invitationId}` : ''
    return NextResponse.redirect(`${site}/premium/test-checkout${q}`, 303)
  }
  const config = safepayConfig()
  if (mode !== 'card' || !config) return back('unavailable')

  try {
    const amountPkr = purpose === 'share' ? serverSharePrice() : serverPrice()
    const tracker = await createTracker(config, amountPkr)
    const orderRef = newOrderRef()
    await createPendingPayment(user.id, 'card', { orderRef, tracker, amountPkr, purpose, invitationId })
    const url = checkoutUrl(config, {
      token: tracker,
      orderRef,
      redirectUrl: `${site}/api/pay/card/done`,
      cancelUrl: `${site}${purpose === 'share' ? cardPath(invitationId, 'cancelled') : '/premium?result=cancelled'}`,
    })
    return NextResponse.redirect(url, 303)
  } catch (err) {
    console.error('card payment start failed', err instanceof Error ? err.message : err)
    return back('error')
  }
}
