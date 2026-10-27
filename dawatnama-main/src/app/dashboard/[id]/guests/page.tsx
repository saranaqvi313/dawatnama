import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import GuestManager from '@/components/dawat/GuestManager'
import { linkCredits } from '@/lib/premium'
import { createClient } from '@/lib/supabase/server'
import type { GuestRow, ReplyRow } from '@/lib/guestStats'

export const metadata = { title: 'Guests — Dawatnama' }
export const dynamic = 'force-dynamic'

export default async function GuestsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pay?: string }> }) {
  const { id } = await params
  const pay = (await searchParams).pay
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect(`/login?next=/dashboard/${id}/guests`)
  const { data: card } = await supabase.from('invitations').select('id, slug, kind, content, published, share_paid, open_count').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!card) notFound()
  const [{ data: guests }, { data: replies }, credits] = await Promise.all([
    supabase.from('guests').select('id, name, phone, slug, party_size, events, link_active, open_count, opened_at, last_opened_at, reminded_at').eq('invitation_id', id).order('created_at'),
    supabase.from('rsvps').select('guest_id, event_name, attending, guests, name').eq('invitation_id', id),
    linkCredits(supabase, auth.user.id),
  ])
  const h = await headers()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`).replace(/\/$/, '')
  const content = (card.content ?? {}) as { name1?: string; name2?: string; eventType?: string; events?: { name?: string }[] }
  const title = [content.name1, content.name2].filter(Boolean).join(' & ') || content.eventType || 'our celebration'
  const eventNames = Array.from(new Set((content.events ?? []).map((e) => String(e?.name ?? '').trim()).filter(Boolean)))
  return (
    <Shell title="Guests">
      <GuestManager
        card={{ id: card.id, slug: card.slug, kind: card.kind ?? 'classic', title, openLinkLive: Boolean(card.published && card.share_paid), opens: Number(card.open_count ?? 0) }}
        initialGuests={(guests ?? []) as GuestRow[]} replies={(replies ?? []) as ReplyRow[]}
        eventNames={eventNames} credits={credits} siteUrl={siteUrl} payResult={pay} />
    </Shell>
  )
}
