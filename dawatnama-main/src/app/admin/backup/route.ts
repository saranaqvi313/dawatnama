import { NextResponse } from 'next/server'
import { currentAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABLES = ['profiles', 'invitations', 'guests', 'rsvps', 'payments'] as const

/** Downloads every table as one JSON file. Admins only. Keep the file somewhere safe: it contains guests' numbers. */
export async function GET() {
  if (!(await currentAdmin())) return new NextResponse('Not found', { status: 404 })
  const admin = createAdminClient()
  const out: Record<string, unknown[]> = {}
  for (const t of TABLES) {
    const rows: unknown[] = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await admin.from(t).select('*').range(from, from + 999)
      if (error) return NextResponse.json({ error: `${t}: ${error.message}` }, { status: 500 })
      rows.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }
    out[t] = rows
  }
  const users: unknown[] = []
  for (let page = 1; page <= 50; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    users.push(...(data?.users ?? []).map((u) => ({ id: u.id, phone: u.phone, name: u.user_metadata?.full_name ?? null, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at })))
    if ((data?.users.length ?? 0) < 1000) break
  }
  out.users = users
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), ...out }, null, 1), {
    headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="dawatnama-backup-${stamp}.json"`, 'cache-control': 'no-store' },
  })
}
