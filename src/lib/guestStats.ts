/** Numbers for the guest dashboard: who is coming, food headcount per function, who opened the card. */
export type GuestRow = {
  id: string; name: string; phone: string | null; slug: string; token: string; party_size: number; events: string[]
  link_active: boolean; open_count: number; opened_at: string | null; last_opened_at: string | null; reminded_at: string | null
}
export type ReplyRow = { guest_id: string | null; event_name: string | null; attending: 'yes' | 'no' | 'maybe'; guests: number; name?: string }

export type EventStat = { event: string; coming: number; comingReplies: number; maybe: number; declined: number; waiting: number; invitedPeople: number }

export const invitedTo = (g: Pick<GuestRow, 'events'>, event: string) => !g.events?.length || g.events.includes(event)

export function guestStats(guests: GuestRow[], replies: ReplyRow[], eventNames: string[]) {
  const events = eventNames.length ? eventNames : ['']
  const live = guests.filter((g) => g.link_active)
  const repliedIds = new Set(replies.filter((r) => r.guest_id).map((r) => r.guest_id))
  const sameEvent = (r: ReplyRow, e: string) => (r.event_name ?? '') === e || (events.length === 1 && !r.event_name)
  const perEvent: EventStat[] = events.map((e) => {
    const rs = replies.filter((r) => sameEvent(r, e))
    const answered = new Set(rs.filter((r) => r.guest_id).map((r) => r.guest_id))
    return {
      event: e,
      coming: rs.filter((r) => r.attending === 'yes').reduce((n, r) => n + (Number(r.guests) || 0), 0),
      comingReplies: rs.filter((r) => r.attending === 'yes').length,
      maybe: rs.filter((r) => r.attending === 'maybe').reduce((n, r) => n + (Number(r.guests) || 0), 0),
      declined: rs.filter((r) => r.attending === 'no').length,
      waiting: live.filter((g) => invitedTo(g, e) && !answered.has(g.id)).length,
      invitedPeople: guests.filter((g) => invitedTo(g, e)).reduce((n, g) => n + g.party_size, 0),
    }
  })
  return {
    guests: guests.length,
    people: guests.reduce((n, g) => n + g.party_size, 0),
    live: live.length,
    opened: live.filter((g) => g.open_count > 0).length,
    replied: live.filter((g) => repliedIds.has(g.id)).length,
    perEvent,
  }
}

/** What a guest answered, e.g. "Mehndi: coming (3) · Baraat: can't come". */
export function replySummary(guestId: string, replies: ReplyRow[]) {
  const mine = replies.filter((r) => r.guest_id === guestId)
  if (!mine.length) return ''
  const word = (r: ReplyRow) => (r.attending === 'yes' ? `coming (${r.guests})` : r.attending === 'maybe' ? 'maybe' : "can't come")
  return mine.map((r) => (r.event_name ? `${r.event_name}: ${word(r)}` : word(r))).join(' · ')
}

export function whatsappHref(phone: string | null, text: string) {
  const digits = (phone ?? '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/**
 * Functions whose name was changed in place (same position, old name gone). Guests are invited to
 * functions by name, so their invitations and replies move to the new name.
 */
export function renamedEvents(before: { name?: string }[] | undefined, after: { name?: string }[] | undefined) {
  const old = (Array.isArray(before) ? before : []).map((e) => String(e?.name ?? '').trim())
  const now = (Array.isArray(after) ? after : []).map((e) => String(e?.name ?? '').trim())
  const from: string[] = [], to: string[] = []
  old.forEach((name, i) => {
    const next = now[i]
    if (name && next && name !== next && !now.includes(name) && !from.includes(name)) { from.push(name); to.push(next) }
  })
  return { from: from.slice(0, 20), to: to.slice(0, 20) }
}
