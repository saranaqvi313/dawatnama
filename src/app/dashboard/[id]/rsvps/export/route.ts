import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  // Row-level security only returns RSVPs for invitations the signed-in user owns.
  const { data } = await supabase.from('rsvps').select('name, attending, guests, message, created_at').eq('invitation_id', id).order('created_at')
  const cell = (v: unknown) => {
    let s = String(v ?? '')
    if (/^[=+\-@]/.test(s)) s = `'${s}` // stop spreadsheet apps treating guest text as a formula
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = [['Name', 'Attending', 'Guests', 'Message', 'Received'].join(',')]
  for (const r of data ?? []) lines.push([r.name, r.attending, r.guests, r.message, r.created_at].map(cell).join(','))
  return new Response('﻿' + lines.join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="rsvps.csv"' },
  })
}
