import { NextResponse, type NextRequest } from 'next/server'
import { completeVerifiedPayment, orderForTracker } from '@/lib/payments'
import { safepayConfig, verifyWebhookSignature } from '@/lib/safepay'

export const runtime = 'nodejs'

type Payload = { data?: Record<string, unknown> & { tracker?: unknown; token?: unknown; state?: unknown; status?: unknown } }

/** Pulls the tracker token out of a webhook payload (Safepay nests it in a few shapes). */
function trackerOf(data: Payload['data']): string {
  const t = data?.tracker
  if (typeof t === 'string') return t
  if (t && typeof t === 'object' && typeof (t as { token?: unknown }).token === 'string') return (t as { token: string }).token
  return typeof data?.token === 'string' ? data.token : ''
}

/**
 * Safepay payment webhook (backup for customers who close the browser before returning).
 * Set it in Safepay → Developer settings → Webhooks: https://YOUR-SITE/api/pay/webhook
 */
export async function POST(request: NextRequest) {
  const config = safepayConfig()
  if (!config) return NextResponse.json({ ok: false }, { status: 503 })
  const body = (await request.json().catch(() => null)) as Payload | null
  if (!body || !verifyWebhookSignature(config.webhookSecret, body.data, request.headers.get('x-sfpy-signature'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const state = String(body.data?.state ?? body.data?.status ?? '').toUpperCase()
  if (state && !/PAID|ENDED|SUCCESS|COMPLETED/.test(state)) return NextResponse.json({ ok: true, ignored: state })
  const tracker = trackerOf(body.data)
  const orderRef = await orderForTracker(tracker)
  if (!orderRef) return NextResponse.json({ ok: true, ignored: 'unknown tracker' })
  const done = await completeVerifiedPayment(orderRef, tracker, `SAFEPAY_WEBHOOK${state ? `_${state}` : ''}`.slice(0, 60)).catch(() => false)
  return NextResponse.json({ ok: done })
}
