import Link from 'next/link'
import Nav from '@/components/Nav'
import { deleteInvitation } from '@/app/actions'
import { dict } from '@/lib/i18n'
import { createClient, getLang } from '@/lib/supabase/server'
import type { Invitation } from '@/lib/types'
import { SHARE_PRICE_LABEL } from '@/lib/pricing'
import SubmitButton from '@/components/SubmitButton'

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const t = dict[await getLang()]
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('invitations').select('*, rsvps(count)').eq('user_id', auth.user?.id ?? '').order('created_at', { ascending: false })
  const rows = (data ?? []) as (Invitation & { share_paid?: boolean; rsvps: { count: number }[] })[]
  const failed = (await searchParams).error || error
  return (
    <>
      <Nav />
      <section className="band dash">
        <div className="dash-head">
          <h2>{t.myInvites}</h2>
          <div className="row-actions">
            <Link href="/#designs" className="btn ghost">Design from scratch</Link>
            <Link href="/templates" className="btn">{t.newInvite}</Link>
          </div>
        </div>
        {failed && <p className="err" role="alert">Something went wrong talking to the database. Check that supabase/schema.sql has been run.</p>}
        {rows.length === 0 && !failed && <p className="muted">{t.empty}</p>}
        <ul className="inv-list">
          {rows.map((r) => (
            <li key={r.id}>
              <div>
                <h3 dir="auto">{[r.content?.name1, r.content?.name2].filter(Boolean).join(' & ') || `${r.content?.eventType ?? 'Invitation'} invitation`}</h3>
                <p className="muted">{r.content?.eventType}{r.kind === 'canvas' ? ' · Designer card' : ''} · <span className={`pill ${r.published ? 'live' : ''}`}>{r.published ? t.live : t.draft}</span>{!r.share_paid && <> · <span className="pill">Link {SHARE_PRICE_LABEL}</span></>}{r.kind !== 'canvas' && <> · {r.rsvps?.[0]?.count ?? 0} {t.guests}</>}</p>
              </div>
              <div className="row-actions">
                <Link className="btn small" href={r.kind === 'canvas' ? `/design/${r.id}` : `/dashboard/${r.id}`}>{t.edit}</Link>
                {r.kind !== 'canvas' && <Link className="btn ghost small" href={`/dashboard/${r.id}/rsvps`}>{t.guests}</Link>}
                {r.published && <Link className="btn ghost small" href={`/i/${r.slug}`} target="_blank">{t.view}</Link>}
                <form action={deleteInvitation}><input type="hidden" name="id" value={r.id} /><SubmitButton className="link danger">{t.del}</SubmitButton></form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
