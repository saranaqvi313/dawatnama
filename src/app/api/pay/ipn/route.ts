import { NextResponse, type NextRequest } from 'next/server'
import { verifyAndComplete } from '@/lib/payments'

export const runtime = 'nodejs'

/**
 * Easypaisa Instant Payment Notification: GET /api/pay/ipn?url=<easypaisa>/order-status/<account>/<orderId>.
 * We never fetch the URL we are given (it could point anywhere). We read the order id from
 * it and ask Easypaisa ourselves through the Inquire API.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url') ?? request.nextUrl.searchParams.get('URL') ?? ''
  const orderId = raw.split('?')[0].split('/').filter(Boolean).pop() ?? ''
  if (!/^[A-Za-z0-9]{6,30}$/.test(orderId)) return NextResponse.json({ ok: false }, { status: 400 })
  const outcome = await verifyAndComplete(orderId).catch(() => 'pending')
  return NextResponse.json({ ok: true, status: outcome })
}
