/** Numbers for one card's analytics page: who opened it, who replied, who is coming. */
import { guestStats, type GuestRow, type ReplyRow } from './guestStats'

export type ViewRow = { guest_id: string | null; visitor: string | null; created_at: string }
export type AnalyticsReply = ReplyRow & { created_at: string; message?: string | null }
export type DayPoint = { day: string; label: string; opens: number; replies: number }

const TZ = 'Asia/Karachi'
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ })

/** Who sent a reply: a guest (by id) or someone on the open link (by the name they typed). */
const replierKey = (r: AnalyticsReply) => (r.guest_id ? `g:${r.guest_id}` : `n:${(r.name ?? '').trim().toLowerCase()}`)

export function cardAnalytics({ openLinkOpens, guests, replies, views, eventNames, now = new Date(), days = 14 }: {
  openLinkOpens: number; guests: GuestRow[]; replies: AnalyticsReply[]; views: ViewRow[]; eventNames: string[]; now?: Date; days?: number
}) {
  const stats = guestStats(guests, replies, eventNames)
  const guestOpens = guests.reduce((n, g) => n + (Number(g.open_count) || 0), 0)
  // Open-link visitors: one per phone (visits from before visitor ids existed count one each).
  const linkViews = views.filter((v) => !v.guest_id)
  const linkVisitors = new Set(linkViews.filter((v) => v.visitor).map((v) => v.visitor)).size + linkViews.filter((v) => !v.visitor).length

  // One entry per person who replied, across all functions.
  const people = new Map<string, { yes: number; maybe: boolean; allNo: boolean }>()
  for (const r of replies) {
    const p = people.get(replierKey(r)) ?? { yes: 0, maybe: false, allNo: true }
    if (r.attending === 'yes') p.yes = Math.max(p.yes, Number(r.guests) || 0)
    if (r.attending === 'maybe') p.maybe = true
    if (r.attending !== 'no') p.allNo = false
    people.set(replierKey(r), p)
  }
  const list = [...people.values()]

  const daily: DayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = dayKey(d)
    daily.push({
      day: key,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ }),
      opens: views.filter((v) => dayKey(new Date(v.created_at)) === key).length,
      replies: new Set(replies.filter((r) => dayKey(new Date(r.created_at)) === key).map(replierKey)).size,
    })
  }

  const repliedIds = new Set(replies.filter((r) => r.guest_id).map((r) => r.guest_id))
  const live = guests.filter((g) => g.link_active)
  return {
    totalOpens: openLinkOpens + guestOpens,
    peopleOpened: stats.opened + linkVisitors,
    linkVisitors,
    guests: stats.guests,
    guestsLive: stats.live,
    guestsOpened: stats.opened,
    guestsReplied: stats.replied,
    responseRate: stats.live ? Math.round((stats.replied / stats.live) * 100) : null,
    respondents: list.length,
    comingRespondents: list.filter((p) => p.yes > 0).length,
    comingPeople: list.reduce((n, p) => n + p.yes, 0),
    maybeRespondents: list.filter((p) => p.yes === 0 && p.maybe).length,
    declinedRespondents: list.filter((p) => p.allNo).length,
    perEvent: stats.perEvent,
    daily,
    /** Opened the card but have not replied: worth a reminder. */
    openedNoReply: live.filter((g) => g.open_count > 0 && !repliedIds.has(g.id)),
    /** Live link sent, never opened. */
    notOpened: live.filter((g) => g.open_count === 0),
  }
}
