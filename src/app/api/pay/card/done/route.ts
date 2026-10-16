import { NextResponse, type NextRequest } from 'next/server'
import { siteUrl, verifyAndComplete } from '@/lib/payments'

export const runtime = 'nodejs'

/**
 * Easypaisa step 2 callback. The status in the URL is only a hint: the order is confirmed
 * with Easypaisa's Inquire API before Premium is switched on.
 */
async function handle(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  const order = request.nextUrl.searchParams.get('order') || request.nextUrl.searchParams.get('orderRefNum') || ''
  const outcome = await verifyAndComplete(order).catch(() => 'pending' as const)
  return NextResponse.redirect(`${site}/premium?result=${outcome}${outcome === 'pending' ? `&order=${encodeURIComponent(order)}` : ''}`, 303)
}

export const GET = handle
export const POST = handle
