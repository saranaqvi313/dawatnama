import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Table from '@/components/Table'
import TableRow from '@/components/TableRow'
import OpensRepliesChart from '@/components/dawat/OpensRepliesChart'
import { ago, cardTitle } from '@/lib/myCards'
import { cardAnalytics, type AnalyticsReply, type ViewRow } from '@/lib/cardAnalytics'
import { whatsappHref, type GuestRow } from '@/lib/guestStats'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Card analytics — Dawatnama' }
export const dynamic = 'force-dynamic'

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

/** One card's analytics: opens, unique visitors, replies, headcount per function, and who to remind. */
export default async function Analytics({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect(`/login?next=/dashboard/${id}/analytics`)
  const { data: card } = await supabase.from('invitations')
    .select('id, slug, kind, content, published, share_paid, open_count, details_updated_at, updated_at')
    .eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!card) notFound()
  const [{ data: guests }, { data: replies }, { data: views }] = await Promise.all([
    supabase.from('guests').select('id, name, phone, slug, token, party_size, events, link_active, open_count, opened_at, last_opened_at, reminded_at').eq('invitation_id', id).order('created_at'),
    supabase.from('rsvps').select('guest_id, event_name, attending, guests, name, message, created_at').eq('invitation_id', id).order('created_at', { ascending: false }),
    supabase.from('card_views').select('guest_id, visitor, created_at').eq('invitation_id', id).order('created_at', { ascending: false }).limit(10000),
  ])
  const content = (card.content ?? {}) as { name1?: string; name2?: string; eventType?: string; events?: { name?: string }[] }
  const title = card.kind === 'canvas' ? String(content.name1 || 'Designer card') : cardTitle(card.content)
  const eventNames = Array.from(new Set((content.events ?? []).map((e) => String(e?.name ?? '').trim()).filter(Boolean)))
  const rs = (replies ?? []) as AnalyticsReply[]
  const a = cardAnalytics({ openLinkOpens: Number(card.open_count ?? 0), guests: (guests ?? []) as GuestRow[], replies: rs, views: (views ?? []) as ViewRow[], eventNames })
  const editHref = card.kind === 'canvas' ? `/design/${card.id}` : `/dashboard/${card.id}`
  const live = Boolean(card.published && card.share_paid)
  const h = await headers()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`).replace(/\/$/, '')

  const tiles = [
    ['Opens', a.totalOpens, 'every time the card was opened'],
    ['People who opened', a.peopleOpened, a.guestsLive ? `${a.guestsOpened} of ${a.guestsLive} guests` : 'different phones'],
    ['Replies', a.respondents, a.responseRate === null ? 'RSVPs received' : `${a.responseRate}% of guests replied`],
    ['Coming', a.comingPeople, `${a.comingRespondents} confirmed · ${a.declinedRespondents} can't come`],
  ] as const
  const funnel = [
    ['Guests on the list', a.guests],
    ['Links sent (live)', a.guestsLive],
    ['Opened the card', a.guestsOpened],
    ['Replied', a.guestsReplied],
  ] as const
  const top = Math.max(1, ...funnel.map(([, v]) => v))

  return (
    <Shell title="Card analytics">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 pl-5 max-lg:pl-3">
          <div className="mr-auto">
            <div className="text-h6" dir="auto">{title}</div>
            <div className="text-body-2 text-t-secondary">
              {live ? <>Live at /{card.slug}</> : 'Link not live yet'}
              {card.details_updated_at && <> · details last changed {ago(card.details_updated_at)}</>}
            </div>
          </div>
          <Button isStroke as="link" href={editHref}>Edit card</Button>
          <Button isStroke as="link" href={`/dashboard/${id}/rsvps`}>All replies</Button>
          <Button isBlack as="link" href={`/dashboard/${id}/guests`}>Guest list</Button>
        </div>
        <div className="grid grid-cols-4 gap-3 p-2 pt-5 max-lg:grid-cols-2">
          {tiles.map(([label, value, note]) => (
            <div key={label} className="p-5 rounded-3xl border border-s-subtle bg-b-depth2 max-md:p-4">
              <div className="mb-2 text-sub-title-1 text-t-secondary">{label}</div>
              <div className="text-h3 max-md:text-h4">{value}</div>
              <div className="mt-1 text-caption text-t-secondary">{note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 max-lg:block">
        <Card className="flex-1 min-w-0" title="Last 14 days">
          <div className="px-5 pt-3 pb-5 max-lg:px-3">
            <OpensRepliesChart data={a.daily} />
            <p className="mt-3 text-caption text-t-tertiary">Opens per day are counted from when analytics was switched on; the totals above include every open.</p>
          </div>
        </Card>
        <Card className="w-100 shrink-0 max-lg:w-full" title="Guest links">
          <div className="flex flex-col gap-4 px-5 pt-3 pb-5 max-lg:px-3">
            {a.guests === 0 ? (
              <p className="text-body-2 text-t-secondary">No personal guest links yet. Add guests to see who opened their card and who replied.</p>
            ) : funnel.map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5 text-body-2"><span>{label}</span><b>{value}<span className="ml-1 font-normal text-t-secondary">{label === 'Guests on the list' ? '' : `${pct(value, a.guests)}%`}</span></b></div>
                <div className="h-2 rounded-[4px] bg-shade-07/15"><div className="h-full rounded-[4px] bg-primary-01" style={{ width: `${(value / top) * 100}%` }} /></div>
              </div>
            ))}
            {a.linkVisitors > 0 && <p className="text-caption text-t-secondary">Plus {a.linkVisitors} {a.linkVisitors === 1 ? 'phone' : 'phones'} through the card&apos;s open link.</p>}
          </div>
        </Card>
      </div>

      <Card title="Headcount per function">
        <div className="p-1 pt-3 overflow-x-auto max-lg:px-0">
          <Table isMobileVisibleTHead cellsThead={['Function', 'Coming (people)', 'Maybe (people)', "Can't come", 'Waiting for reply', 'Invited (people)'].map((h) => <th key={h}>{h}</th>)}>
            {a.perEvent.map((e) => (
              <TableRow key={e.event || 'all'}>
                <td className="text-sub-title-1" dir="auto">{e.event || 'The event'}</td>
                <td><b>{e.coming}</b> <span className="text-t-secondary">({e.comingReplies} replies)</span></td>
                <td>{e.maybe}</td>
                <td>{e.declined}</td>
                <td>{e.waiting}</td>
                <td className="text-t-secondary">{e.invitedPeople || '—'}</td>
              </TableRow>
            ))}
          </Table>
        </div>
      </Card>

      <div className="flex gap-3 max-lg:block">
        <Card className="flex-1 min-w-0" title={`Opened, no reply yet (${a.openedNoReply.length})`}>
          <GuestList guests={a.openedNoReply} empty="Everyone who opened the card has replied." remind={title} siteUrl={siteUrl} />
        </Card>
        <Card className="flex-1 min-w-0" title={`Not opened yet (${a.notOpened.length})`}>
          <GuestList guests={a.notOpened} empty="Every live link has been opened." remind={title} siteUrl={siteUrl} />
        </Card>
      </div>

      <Card title="Latest replies">
        {rs.length === 0 ? (
          <div className="py-12 text-center text-body-2 text-t-secondary">No replies yet. Share the card to start collecting RSVPs.</div>
        ) : (
          <ul className="px-5 pb-5 max-lg:px-3">
            {rs.slice(0, 10).map((r, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 py-3 border-b border-s-subtle last:border-0">
                <span className="text-sub-title-1" dir="auto">{r.name}</span>
                <span className={`label ${r.attending === 'yes' ? 'label-green' : r.attending === 'maybe' ? 'label-yellow' : 'label-red'}`}>
                  {r.attending === 'yes' ? `Coming · ${r.guests}` : r.attending === 'maybe' ? 'Maybe' : "Can't come"}
                </span>
                {r.event_name && <span className="text-caption text-t-secondary" dir="auto">{r.event_name}</span>}
                <span className="ml-auto text-caption text-t-tertiary">{ago(r.created_at)}</span>
                {r.message && <p className="basis-full mt-1 text-body-2 text-t-secondary" dir="auto">“{r.message}”</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  )
}

function GuestList({ guests, empty, remind, siteUrl }: { guests: GuestRow[]; empty: string; remind: string; siteUrl: string }) {
  if (!guests.length) return <p className="px-5 pb-5 text-body-2 text-t-secondary max-lg:px-3">{empty}</p>
  return (
    <ul className="px-5 pb-4 max-lg:px-3">
      {guests.slice(0, 30).map((g) => (
        <li key={g.id} className="flex items-center gap-3 py-2.5 border-b border-s-subtle last:border-0">
          <span className="mr-auto text-body-2" dir="auto">{g.name}{g.party_size > 1 && <span className="text-t-secondary"> · {g.party_size}</span>}</span>
          {g.last_opened_at && <span className="text-caption text-t-tertiary">opened {ago(g.last_opened_at)}</span>}
          {g.phone && (
            <a className="text-caption text-t-blue" target="_blank" rel="noreferrer"
              href={whatsappHref(g.phone, `Assalam o Alaikum ${g.name}, a gentle reminder about ${remind}. Please let us know if you can come: ${siteUrl}/${g.slug}/${g.token}`)}>
              Remind
            </a>
          )}
        </li>
      ))}
      {guests.length > 30 && <li className="pt-2 text-caption text-t-secondary">and {guests.length - 30} more on the guest list.</li>}
    </ul>
  )
}
