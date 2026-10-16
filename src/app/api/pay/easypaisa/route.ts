import { NextResponse, type NextRequest } from 'next/server'
import { easypaisaConfig, initiateMobileAccount, toLocalMobile } from '@/lib/easypaisa'
import { createPendingPayment, markFailed, paymentMode, sameOrigin, siteUrl, verifyAndComplete } from '@/lib/payments'
import { isPremium } from '@/lib/premium'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
// The customer has up to about a minute and a half to approve on their phone.
export const maxDuration = 120

/** Charges the customer's Easypaisa account. Responds once they approve or decline. */
export async function POST(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  if (!sameOrigin(request, site)) return NextResponse.json({ status: 'failed', message: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return NextResponse.json({ status: 'failed', message: 'Please sign in again.' }, { status: 401 })
  if (await isPremium(supabase, user.id)) return NextResponse.json({ status: 'paid' })

  const body = (await request.json().catch(() => ({}))) as { mobile?: string }
  const mobile = toLocalMobile(String(body.mobile ?? ''))
  if (!mobile) return NextResponse.json({ status: 'failed', message: 'Enter your Easypaisa number like 0345 1234567.' }, { status: 400 })

  const mode = paymentMode()
  if (mode === 'demo') return NextResponse.json({ status: 'demo', redirect: '/premium/test-checkout?method=easypaisa' })
  const config = easypaisaConfig()
  if (mode !== 'easypaisa' || !config) return NextResponse.json({ status: 'failed', message: 'Payments are not set up yet.' }, { status: 503 })

  const { orderRef, amountPkr } = await createPendingPayment(user.id, 'easypaisa')
  try {
    const result = await initiateMobileAccount(config, { orderRef, amountPkr, mobile, email: user.email || undefined })
    if (result.responseCode !== '0000') {
      await markFailed(orderRef, `MA_${result.responseCode ?? 'ERR'}`)
      return NextResponse.json({ status: 'failed', message: describe(result.responseCode, result.responseDesc) })
    }
  } catch {
    // Timed out or the gateway is unreachable: the payment may still go through, so check it.
    const outcome = await verifyAndComplete(orderRef).catch(() => 'pending' as const)
    return NextResponse.json({ status: outcome, order: orderRef })
  }
  const outcome = await verifyAndComplete(orderRef)
  return NextResponse.json({ status: outcome, order: orderRef })
}

function describe(code?: string, desc?: string) {
  if (code === '0001' || /declin|reject|cancel/i.test(desc ?? '')) return 'The payment was declined on your phone.'
  if (/balance|insufficient/i.test(desc ?? '')) return 'Your Easypaisa account does not have enough balance.'
  if (/timeout|time out|expired/i.test(desc ?? '')) return 'The approval request timed out. Please try again.'
  return desc ? `Easypaisa: ${desc}` : 'The payment did not go through. Please try again.'
}
