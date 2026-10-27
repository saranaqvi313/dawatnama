import { headers } from 'next/headers'
import Shell from '@/components/dawat/Shell'
import InvitationsBoard from '@/components/dawat/InvitationsBoard'
import RecentReplies from '@/components/dawat/RecentReplies'
import { loadMyCards } from '@/lib/myCards'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'My cards — Dawatnama' }
export const dynamic = 'force-dynamic'

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const viewer = await getViewer()
  const supabase = await createClient()
  const { cards, replies, totals, error } = await loadMyCards(supabase, viewer?.id ?? '')
  const failed = (await searchParams).error || error
  const h = await headers()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`).replace(/\/$/, '')
  const stats = [
    ['Cards', totals.cards],
    ['Guests', totals.guests],
    ['Coming', totals.coming],
    ['Opened', totals.opens],
  ] as const
  return (
    <Shell title="My cards" viewer={viewer}>
      {failed && <div className="mb-3 card"><div className="p-2 text-body-2 text-primary-03" role="alert">Something went wrong talking to the database. Check that supabase/schema.sql has been run.</div></div>}
      {cards.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-3 max-md:grid-cols-2">
          {stats.map(([label, value]) => (
            <div key={label} className="card !mb-0 !px-5 !py-4">
              <div className="text-caption text-t-secondary">{label}</div>
              <div className="text-h4 max-md:text-h5">{value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex max-lg:block">
        <div className={cards.length ? 'col-left' : 'w-full'}>
          <InvitationsBoard cards={cards} title="Your cards" siteUrl={siteUrl} grid />
        </div>
        {cards.length > 0 && (
          <div className="col-right">
            <RecentReplies replies={replies.slice(0, 5)} href="/guests" />
          </div>
        )}
      </div>
    </Shell>
  )
}
