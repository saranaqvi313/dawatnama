import { NextResponse, type NextRequest } from 'next/server'
import { createPendingPayment, newOrderRef, paymentMode, sameOrigin, siteUrl } from '@/lib/payments'
import { isPremium } from '@/lib/premium'
import { serverPrice } from '@/lib/pricing'
import { checkoutUrl, createTracker, safepayConfig } from '@/lib/safepay'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** Starts a card payment: creates the Safepay payment, records it, sends the customer to Safepay. */
export async function POST(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  if (!sameOrigin(request, site)) return new NextResponse('Forbidden', { status: 403 })
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return NextResponse.redirect(`${site}/login?next=/premium`, 303)
  if (await isPremium(supabase, user.id)) return NextResponse.redirect(`${site}/premium?result=paid`, 303)

  const mode = paymentMode()
  if (mode === 'demo') return NextResponse.redirect(`${site}/premium/test-checkout`, 303)
  const config = safepayConfig()
  if (mode !== 'card' || !config) return NextResponse.redirect(`${site}/premium?result=unavailable`, 303)

  try {
    const amountPkr = serverPrice()
    const tracker = await createTracker(config, amountPkr)
    const orderRef = newOrderRef()
    await createPendingPayment(user.id, 'card', { orderRef, tracker, amountPkr })
    const url = checkoutUrl(config, {
      token: tracker,
      orderRef,
      redirectUrl: `${site}/api/pay/card/done`,
      cancelUrl: `${site}/premium?result=cancelled`,
    })
    return NextResponse.redirect(url, 303)
  } catch (err) {
    console.error('card payment start failed', err instanceof Error ? err.message : err)
    return NextResponse.redirect(`${site}/premium?result=error`, 303)
  }
}
