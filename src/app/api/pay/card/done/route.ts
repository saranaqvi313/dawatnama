import { NextResponse, type NextRequest } from 'next/server'
import { completeVerifiedPayment, returnPathFor, siteUrl } from '@/lib/payments'
import { safepayConfig, verifyRedirectSignature } from '@/lib/safepay'

export const runtime = 'nodejs'

/**
 * Safepay sends the customer back here after a successful card payment, with tracker,
 * sig, reference and order_id. Premium (or the card's share link) is switched on only if the signature is valid and
 * the tracker is the one created for this order.
 */
async function handle(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  const q = request.nextUrl.searchParams
  let fields: Record<string, string> = Object.fromEntries(q.entries())
  if (request.method === 'POST') {
    const type = request.headers.get('content-type') ?? ''
    if (type.includes('application/json')) fields = { ...fields, ...((await request.json().catch(() => ({}))) as Record<string, string>) }
    else {
      const form = await request.formData().catch(() => null)
      if (form) for (const [k, v] of form.entries()) if (typeof v === 'string') fields[k] = v
    }
  }
  const tracker = String(fields.tracker ?? '')
  const sig = String(fields.sig ?? '')
  const orderRef = String(fields.order_id ?? '')
  const config = safepayConfig()

  if (!config || !verifyRedirectSignature(config.secret, tracker, sig)) {
    return NextResponse.redirect(`${site}${await returnPathFor(orderRef, 'failed').catch(() => '/premium?result=failed')}`, 303)
  }
  const ok = await completeVerifiedPayment(orderRef, tracker, 'SAFEPAY_REDIRECT').catch(() => false)
  const path = await returnPathFor(orderRef, ok ? 'paid' : 'failed').catch(() => `/premium?result=${ok ? 'paid' : 'failed'}`)
  return NextResponse.redirect(`${site}${path}`, 303)
}

export const GET = handle
export const POST = handle
