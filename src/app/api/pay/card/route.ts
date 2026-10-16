import { NextResponse, type NextRequest } from 'next/server'
import { cardCheckoutFields, easypaisaConfig, toLocalMobile } from '@/lib/easypaisa'
import { autoPostResponse } from '@/lib/autopost'
import { createPendingPayment, paymentMode, sameOrigin, siteUrl } from '@/lib/payments'
import { isPremium } from '@/lib/premium'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** Starts a card payment: records the order, then hands the browser to Easypaisa's card page. */
export async function POST(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  if (!sameOrigin(request, site)) return new NextResponse('Forbidden', { status: 403 })
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return NextResponse.redirect(`${site}/login?next=/premium`, 303)
  if (await isPremium(supabase, user.id)) return NextResponse.redirect(`${site}/premium?result=paid`, 303)

  const mode = paymentMode()
  if (mode === 'demo') return NextResponse.redirect(`${site}/premium/test-checkout?method=card`, 303)
  const config = easypaisaConfig()
  if (mode !== 'easypaisa' || !config) return NextResponse.redirect(`${site}/premium?result=unavailable`, 303)

  const { orderRef, amountPkr } = await createPendingPayment(user.id, 'card')
  const { action, fields } = cardCheckoutFields(config, {
    orderRef,
    amountPkr,
    postBackURL: `${site}/api/pay/card/return?order=${orderRef}`,
    mobile: user.phone ? toLocalMobile(user.phone) ?? undefined : undefined,
    email: user.email || undefined,
  })
  return autoPostResponse(action, fields)
}
