import { NextResponse, type NextRequest } from 'next/server'
import { verifyAndComplete } from '@/lib/payments'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** Lets the Premium page re-check a pending order that belongs to the signed-in user. */
export async function GET(request: NextRequest) {
  const order = request.nextUrl.searchParams.get('order') ?? ''
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ status: 'failed' }, { status: 401 })
  // RLS: this only finds the order if it is the user's own.
  const { data: row } = await supabase.from('payments').select('order_ref').eq('order_ref', order).maybeSingle()
  if (!row) return NextResponse.json({ status: 'failed' }, { status: 404 })
  return NextResponse.json({ status: await verifyAndComplete(order).catch(() => 'pending') })
}
