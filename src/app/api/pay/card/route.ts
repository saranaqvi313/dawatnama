import { NextResponse, type NextRequest } from 'next/server'
import { createPendingPayment, newOrderRef, paymentMode, safeReturn, sameOrigin, siteUrl, withResult } from '@/lib/payments'
import { isPremium } from '@/lib/premium'
import { PRODUCTS, isProductId, serverPriceOf, type ProductId } from '@/lib/pricing'
import { checkoutUrl, createTracker, safepayConfig } from '@/lib/safepay'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/errors'

export const runtime = 'nodejs'

/**
 * Starts a card payment for one product (Premium, a link bundle or the Shaadi package):
 * creates the Safepay payment, records it, sends the customer to Safepay.
 * Form fields: product, and optionally return (a same-site path to come back to).
 */
export async function POST(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  if (!sameOrigin(request, site)) return new NextResponse('Forbidden', { status: 403 })
  const form = await request.formData().catch(() => null)
  const raw = String(form?.get('product') ?? '')
  // Older pages posted purpose=share for one card link.
  const productId: ProductId = isProductId(raw) ? raw : form?.get('purpose') === 'share' ? 'links1' : 'premium'
  const product = PRODUCTS[productId]
  const returnPath = safeReturn(String(form?.get('return') ?? '')) ?? (form?.get('invitation') ? `/dashboard/${String(form.get('invitation')).replace(/[^0-9a-f-]/gi, '')}` : null)
  const back = (result: string) => NextResponse.redirect(`${site}${returnPath ? withResult(returnPath, result) : `/premium?result=${result}`}`, 303)

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return NextResponse.redirect(`${site}/login?next=${encodeURIComponent(returnPath ?? '/premium')}`, 303)
  if (product.id === 'premium' && (await isPremium(supabase, user.id))) return back('paid')

  const mode = paymentMode()
  if (mode === 'demo') {
    const q = new URLSearchParams({ product: product.id, ...(returnPath ? { return: returnPath } : {}) })
    return NextResponse.redirect(`${site}/premium/test-checkout?${q}`, 303)
  }
  const config = safepayConfig()
  if (mode !== 'card' || !config) return back('unavailable')

  try {
    const amountPkr = serverPriceOf(product.id)
    const tracker = await createTracker(config, amountPkr)
    const orderRef = newOrderRef()
    await createPendingPayment(user.id, 'card', { orderRef, tracker, product: product.id, returnPath: returnPath ?? undefined })
    const url = checkoutUrl(config, {
      token: tracker,
      orderRef,
      redirectUrl: `${site}/api/pay/card/done`,
      cancelUrl: `${site}${returnPath ? withResult(returnPath, 'cancelled') : '/premium?result=cancelled'}`,
    })
    return NextResponse.redirect(url, 303)
  } catch (err) {
    await logError('pay-start', err, request.nextUrl.pathname, undefined, user.id)
    return back('error')
  }
}
