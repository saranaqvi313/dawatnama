/** Everything the dashboard pages show about the signed-in person's cards. Server-only. */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CanvasDoc } from './canvas'
import { normalize, type Content, type Design } from './types'

export type CardRow = {
  id: string
  slug: string
  kind: 'classic' | 'canvas'
  title: string
  eventType: string
  published: boolean
  sharePaid: boolean
  opens: number
  createdAt: string
  updatedAt: string
  replies: number
  coming: number
  guests: number
  guestsLive: number
  guestsOpened: number
  design: Design | null
  canvas: CanvasDoc | null
  editHref: string
}

export type ReplyItem = { id: string; invitationId: string; card: string; name: string; attending: 'yes' | 'no' | 'maybe'; guests: number; event: string | null; message: string | null; createdAt: string }

export function cardTitle(content: Partial<Content> | null | undefined) {
  const c = content ?? {}
  return [c.name1, c.name2].filter(Boolean).join(' & ') || `${c.eventType ?? 'Invitation'} invitation`
}

export async function loadMyCards(supabase: SupabaseClient, userId: string) {
  const [{ data: cards, error }, { data: guests }, { data: replies }] = await Promise.all([
    supabase.from('invitations').select('id, slug, kind, template, content, design, canvas, published, share_paid, open_count, created_at, updated_at')
      .eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('guests').select('invitation_id, link_active, open_count, party_size').eq('user_id', userId),
    supabase.from('rsvps').select('id, invitation_id, name, attending, guests, event_name, message, created_at, invitations!inner(user_id)')
      .eq('invitations.user_id', userId).order('created_at', { ascending: false }).limit(1000),
  ])
  const gs = guests ?? []
  const rs = (replies ?? []) as unknown as { id: string; invitation_id: string; name: string; attending: 'yes' | 'no' | 'maybe'; guests: number; event_name: string | null; message: string | null; created_at: string }[]
  const titleOf = new Map<string, string>()
  const rows: CardRow[] = (cards ?? []).map((c) => {
    const kind = c.kind === 'canvas' ? 'canvas' : 'classic'
    const mine = gs.filter((g) => g.invitation_id === c.id)
    const myReplies = rs.filter((r) => r.invitation_id === c.id)
    const title = kind === 'canvas' ? String((c.content as Content | null)?.name1 || 'Designer card') : cardTitle(c.content as Content)
    titleOf.set(c.id, title)
    return {
      id: c.id, slug: c.slug, kind, title,
      eventType: String((c.content as Content | null)?.eventType ?? ''),
      published: Boolean(c.published), sharePaid: Boolean(c.share_paid), opens: Number(c.open_count ?? 0),
      createdAt: c.created_at, updatedAt: c.updated_at ?? c.created_at,
      replies: myReplies.length,
      coming: myReplies.filter((r) => r.attending === 'yes').reduce((n, r) => n + (Number(r.guests) || 0), 0),
      guests: mine.length, guestsLive: mine.filter((g) => g.link_active).length, guestsOpened: mine.filter((g) => g.open_count > 0).length,
      design: kind === 'classic' ? normalize(c.content as Content, c.design as Design, c.template).design : null,
      canvas: kind === 'canvas' ? (c.canvas as CanvasDoc) : null,
      editHref: kind === 'canvas' ? `/design/${c.id}` : `/dashboard/${c.id}`,
    }
  })
  const items: ReplyItem[] = rs.map((r) => ({
    id: r.id, invitationId: r.invitation_id, card: titleOf.get(r.invitation_id) ?? '', name: r.name, attending: r.attending,
    guests: Number(r.guests) || 0, event: r.event_name, message: r.message, createdAt: r.created_at,
  }))
  const totals = {
    cards: rows.length,
    live: rows.filter((r) => r.published).length,
    guests: gs.length,
    people: gs.reduce((n, g) => n + (Number(g.party_size) || 0), 0),
    guestsLive: gs.filter((g) => g.link_active).length,
    opened: gs.filter((g) => g.open_count > 0).length + rows.reduce((n, r) => n + (r.opens > 0 ? 1 : 0), 0),
    opens: rows.reduce((n, r) => n + r.opens, 0) + gs.reduce((n, g) => n + (Number(g.open_count) || 0), 0),
    replies: items.length,
    coming: rows.reduce((n, r) => n + r.coming, 0),
  }
  return { cards: rows, replies: items, totals, error }
}

/** Replies per day for the last `days` days (oldest first), for the kit bar chart. */
export function repliesPerDay(replies: ReplyItem[], days = 7) {
  const out: { name: string; amt: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    out.push({ name: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Asia/Karachi' }).slice(0, 2), amt: replies.filter((r) => r.createdAt.slice(0, 10) === key).length })
  }
  return out
}

export const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
