import { headers } from 'next/headers'
import Shell from '@/components/dawat/Shell'
import DashboardOverview from '@/components/dawat/DashboardOverview'
import InvitationsBoard from '@/components/dawat/InvitationsBoard'
import RecentReplies from '@/components/dawat/RecentReplies'
import PlanCard from '@/components/dawat/PlanCard'
import { loadMyCards, repliesPerDay } from '@/lib/myCards'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'Dashboard — Dawatnama' }
export const dynamic = 'force-dynamic'

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const viewer = await getViewer()
  const supabase = await createClient()
  const { cards, replies, totals, error } = await loadMyCards(supabase, viewer?.id ?? '')
  const failed = (await searchParams).error || error
  const h = await headers()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`).replace(/\/$/, '')
  const tiles = [
    { id: 1, icon: 'product-think', label: 'Invitations', value: totals.cards, note: `${totals.live} with a live link` },
    { id: 2, icon: 'profile', label: 'Guests', value: totals.guests, note: `${totals.people} people · ${totals.guestsLive} links live` },
    { id: 3, icon: 'check-circle', label: 'Coming', value: totals.coming, note: `people, from ${totals.replies} repl${totals.replies === 1 ? 'y' : 'ies'}` },
    { id: 4, icon: 'earth', label: 'Opened', value: totals.opens, note: `${totals.opened} guest${totals.opened === 1 ? '' : 's'} opened their card` },
  ]
  return (
    <Shell title="Dashboard" viewer={viewer}>
      {failed && <div className="mb-3 card"><div className="p-2 text-body-2 text-primary-03" role="alert">Something went wrong talking to the database. Check that supabase/schema.sql has been run.</div></div>}
      <div className="flex max-lg:block">
        <div className="col-left">
          <DashboardOverview tiles={tiles} week={repliesPerDay(replies, 7)} month={repliesPerDay(replies, 30)} />
          <InvitationsBoard cards={cards} title="Recent invitations" compact siteUrl={siteUrl} />
        </div>
        <div className="col-right">
          <PlanCard premium={Boolean(viewer?.premium)} credits={viewer?.credits ?? 0} />
          <RecentReplies replies={replies.slice(0, 4)} href="/guests" />
        </div>
      </div>
    </Shell>
  )
}
