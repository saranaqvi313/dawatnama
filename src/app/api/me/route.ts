import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/viewer'

export const dynamic = 'force-dynamic'

/** Who is signed in (used by the dashboard header on pages that do not load it themselves). */
export async function GET() {
  const viewer = await getViewer().catch(() => null)
  return NextResponse.json({ viewer }, { headers: { 'cache-control': 'private, no-store' } })
}
