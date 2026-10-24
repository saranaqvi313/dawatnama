import { notFound } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import Button from '@/components/Button'
import Table from '@/components/Table'
import TableRow from '@/components/TableRow'
import { cardTitle } from '@/lib/myCards'
import { createClient } from '@/lib/supabase/server'
import type { Rsvp } from '@/lib/types'

export const metadata = { title: 'Replies — Dawatnama' }

export default async function Rsvps({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: inv } = await supabase.from('invitations').select('id, slug, content').eq('id', id).eq('user_id', auth.user?.id ?? '').maybeSingle()
  if (!inv) notFound()
  const { data } = await supabase.from('rsvps').select('*').eq('invitation_id', id).order('created_at', { ascending: false })
  const rows = (data ?? []) as (Rsvp & { event_name?: string | null })[]
  const coming = rows.filter((r) => r.attending === 'yes')
  const total = coming.reduce((n, r) => n + r.guests, 0)
  const tiles = [['Replies', rows.length], ['Coming', coming.length], ['Total guests', total], ['Declined', rows.filter((r) => r.attending === 'no').length]] as const
  return (
    <Shell title="Replies">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 pl-5 max-lg:pl-3">
          <div className="mr-auto">
            <div className="text-h6" dir="auto">{cardTitle(inv.content)}</div>
            <div className="text-body-2 text-t-secondary">Everyone who replied on the card</div>
          </div>
          <Button isStroke as="link" href={`/dashboard/${id}/guests`}>Guest list</Button>
          <Button isBlack as="a" href={`/dashboard/${id}/rsvps/export`}>Export CSV</Button>
        </div>
        <div className="grid grid-cols-4 gap-3 p-2 pt-5 max-md:grid-cols-2">
          {tiles.map(([label, value]) => (
            <div key={label} className="p-5 rounded-3xl border border-s-subtle bg-b-depth2 max-md:p-4">
              <div className="mb-2 text-sub-title-1 text-t-secondary">{label}</div>
              <div className="text-h3 max-md:text-h4">{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="flex items-center h-12 pl-5 max-lg:pl-3"><div className="text-h6">All replies</div></div>
        {rows.length === 0 ? (
          <div className="py-16 text-center text-body-2 text-t-secondary">No replies yet. Share your link to start collecting RSVPs.</div>
        ) : (
          <div className="p-1 pt-3 overflow-x-auto max-lg:px-0">
            <Table isMobileVisibleTHead cellsThead={['Name', 'Function', 'Attending', 'People', 'Message', 'Received'].map((h) => <th key={h}>{h}</th>)}>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <td className="text-sub-title-1" dir="auto">{r.name}</td>
                  <td dir="auto">{r.event_name ?? '—'}</td>
                  <td><span className={`label ${r.attending === 'yes' ? 'label-green' : r.attending === 'maybe' ? 'label-yellow' : 'label-red'}`}>{r.attending === 'yes' ? 'Coming' : r.attending === 'maybe' ? 'Maybe' : "Can't come"}</span></td>
                  <td>{r.guests}</td>
                  <td className="max-w-80 text-t-secondary" dir="auto">{r.message}</td>
                  <td className="whitespace-nowrap text-t-secondary">{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                </TableRow>
              ))}
            </Table>
          </div>
        )}
      </div>
    </Shell>
  )
}
