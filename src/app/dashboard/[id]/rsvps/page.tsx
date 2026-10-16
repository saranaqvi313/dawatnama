import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/server'
import type { Rsvp } from '@/lib/types'

export default async function Rsvps({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: inv } = await supabase.from('invitations').select('id, slug, content').eq('id', id).eq('user_id', auth.user?.id ?? '').maybeSingle()
  if (!inv) notFound()
  const { data } = await supabase.from('rsvps').select('*').eq('invitation_id', id).order('created_at', { ascending: false })
  const rows = (data ?? []) as Rsvp[]
  const coming = rows.filter((r) => r.attending === 'yes')
  const total = coming.reduce((n, r) => n + r.guests, 0)
  return (
    <>
      <Nav />
      <section className="band dash">
        <div className="dash-head">
          <div><Link href={`/dashboard/${id}`}>← Back to editor</Link><h2>RSVPs</h2></div>
          <a className="btn ghost" href={`/dashboard/${id}/rsvps/export`}>Export CSV</a>
        </div>
        <div className="stats">
          <div><b>{rows.length}</b><span>Replies</span></div>
          <div><b>{coming.length}</b><span>Coming</span></div>
          <div><b>{total}</b><span>Total guests</span></div>
          <div><b>{rows.filter((r) => r.attending === 'no').length}</b><span>Declined</span></div>
        </div>
        {rows.length === 0 ? <p className="muted">No replies yet. Share your link to start collecting RSVPs.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Attending</th><th>Guests</th><th>Message</th><th>Received</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}><td dir="auto">{r.name}</td><td>{r.attending}</td><td>{r.guests}</td><td dir="auto">{r.message}</td><td>{new Date(r.created_at).toLocaleDateString('en-GB')}</td></tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  )
}
