import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import SubmitButton from '@/components/SubmitButton'
import { adminState } from '@/lib/admin'
import { rupees } from '@/lib/pricing'
import { createAdminClient } from '@/lib/supabase/admin'
import { clearErrors, grantToUser, unlockAdmin } from './actions'

export const metadata = { title: 'Admin — Dawatnama', robots: { index: false } }
export const dynamic = 'force-dynamic'

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; wrong?: string }> }) {
  const sp = await searchParams
  const { state } = await adminState()
  if (state === 'no') notFound()
  if (state !== 'ok') return (
    <>
      <Nav />
      <section className="auth">
        <h1>Admin</h1>
        {state === 'no-password' ? (
          <p className="err">Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy. The admin page stays closed until then.</p>
        ) : (
          <form action={unlockAdmin} className="auth-form">
            <label>Admin password<input name="password" type="password" required autoComplete="current-password" /></label>
            <SubmitButton className="btn">Open admin</SubmitButton>
            {sp.wrong && <p className="err" role="alert">Wrong password.</p>}
          </form>
        )}
      </section>
    </>
  )
  const tab = sp.tab ?? 'overview'
  const admin = createAdminClient()
  const count = async (t: string, f?: (q: ReturnType<ReturnType<typeof admin.from>['select']>) => unknown) => {
    let q = admin.from(t).select('*', { count: 'exact', head: true })
    if (f) q = f(q) as typeof q
    return (await q).count ?? 0
  }
  const [cards, liveCards, guests, liveGuests, rsvps, errorsCount, paidRows, usersPage] = await Promise.all([
    count('invitations'), count('invitations', (q) => q.eq('published', true)), count('guests'), count('guests', (q) => q.eq('link_active', true)),
    count('rsvps'), count('error_logs'),
    admin.from('payments').select('amount_pkr, method').eq('status', 'paid').limit(10000),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ])
  const revenue = (paidRows.data ?? []).filter((p) => p.method === 'card').reduce((n, p) => n + p.amount_pkr, 0)
  const users = usersPage.data?.users ?? []
  const [{ data: payments }, { data: recentCards }, { data: profiles }, { data: errors }] = await Promise.all([
    admin.from('payments').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('invitations').select('id, slug, kind, content, published, share_paid, open_count, created_at, user_id').order('created_at', { ascending: false }).limit(100),
    admin.from('profiles').select('*'),
    admin.from('error_logs').select('*').order('created_at', { ascending: false }).limit(100),
  ])
  const phoneOf = new Map(users.map((u) => [u.id, u.phone ? `+${u.phone.replace(/^\+/, '')}` : String(u.user_metadata?.phone ?? '')]))
  const profileOf = new Map((profiles ?? []).map((p) => [p.user_id, p]))
  const tabs = [['overview', 'Overview'], ['payments', 'Payments'], ['users', 'Users'], ['cards', 'Cards'], ['errors', `Errors (${errorsCount})`]]

  return (
    <>
      <Nav />
      <section className="band dash admin">
        <div className="dash-head"><h2>Admin</h2><a className="btn ghost" href="/admin/backup">Download backup (JSON)</a></div>
        <nav className="tabs admin-tabs">{tabs.map(([k, l]) => <a key={k} href={`/admin?tab=${k}`} className={tab === k ? 'on' : ''}>{l}</a>)}</nav>

        {tab === 'overview' && (
          <div className="stats">
            <div><b>{users.length}{users.length === 200 ? '+' : ''}</b><span>Users</span></div>
            <div><b>{rupees(revenue)}</b><span>Card payments received</span></div>
            <div><b>{cards}</b><span>Cards ({liveCards} with open link live)</span></div>
            <div><b>{liveGuests}</b><span>Guest links live (of {guests})</span></div>
            <div><b>{rsvps}</b><span>RSVP replies</span></div>
            <div><b>{errorsCount}</b><span>Errors logged</span></div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="table-wrap"><table>
            <thead><tr><th>When</th><th>User</th><th>Product</th><th>Amount</th><th>Method</th><th>Status</th><th>Order</th></tr></thead>
            <tbody>{(payments ?? []).map((p) => (
              <tr key={p.id}><td>{when(p.created_at)}</td><td dir="ltr">{phoneOf.get(p.user_id) || p.user_id.slice(0, 8)}</td><td>{p.product ?? p.purpose}</td><td>{rupees(p.amount_pkr)}</td><td>{p.method}</td>
                <td><span className={`pill ${p.status === 'paid' ? 'live' : ''}`}>{p.status}</span></td><td dir="ltr"><small>{p.order_ref}</small></td></tr>
            ))}</tbody>
          </table></div>
        )}

        {tab === 'users' && (
          <>
            <div className="table-wrap"><table>
              <thead><tr><th>Phone</th><th>Name</th><th>Joined</th><th>Last sign-in</th><th>Premium</th><th>Links left</th><th>Give</th></tr></thead>
              <tbody>{users.map((u) => {
                const p = profileOf.get(u.id)
                return (
                  <tr key={u.id}>
                    <td dir="ltr">{phoneOf.get(u.id) || '—'}</td><td dir="auto">{String(u.user_metadata?.full_name ?? '')}</td><td>{when(u.created_at)}</td><td>{when(u.last_sign_in_at)}</td>
                    <td>{p?.is_premium ? 'Yes' : '—'}</td><td>{p?.link_credits ?? 0}</td>
                    <td>
                      <form action={grantToUser} className="admin-grant">
                        <input type="hidden" name="user_id" value={u.id} />
                        <input name="credits" type="number" min={0} max={1000} placeholder="Links" aria-label="Links to add" />
                        <label className="check"><input type="checkbox" name="premium" />Premium</label>
                        <SubmitButton className="btn small">Add</SubmitButton>
                      </form>
                    </td>
                  </tr>
                )
              })}</tbody>
            </table></div>
            <p className="muted small-note">Showing the newest 200 users. “Give” adds links or Premium for free, e.g. to fix a payment problem.</p>
          </>
        )}

        {tab === 'cards' && (
          <div className="table-wrap"><table>
            <thead><tr><th>Created</th><th>Card</th><th>Owner</th><th>Link</th><th>Opens</th></tr></thead>
            <tbody>{(recentCards ?? []).map((c) => {
              const ct = (c.content ?? {}) as { name1?: string; name2?: string; eventType?: string }
              return (
                <tr key={c.id}><td>{when(c.created_at)}</td><td dir="auto">{[ct.name1, ct.name2].filter(Boolean).join(' & ') || ct.eventType}{c.kind === 'canvas' ? ' (designer)' : ''}</td>
                  <td dir="ltr">{phoneOf.get(c.user_id) || '—'}</td>
                  <td>{c.published && c.share_paid ? <a href={`/${c.slug}`} target="_blank" rel="noreferrer">/{c.slug}</a> : <span className="muted">/{c.slug}</span>}</td><td>{c.open_count ?? 0}</td></tr>
              )
            })}</tbody>
          </table></div>
        )}

        {tab === 'errors' && (
          <>
            <form action={clearErrors}><SubmitButton className="btn ghost small">Clear all errors</SubmitButton></form>
            {(errors ?? []).length === 0 ? <p className="muted">No errors logged. 🎉</p> : (
              <ul className="err-list">{(errors ?? []).map((e) => (
                <li key={e.id}>
                  <div><span className="pill">{e.source}</span> <b>{e.message}</b></div>
                  <small className="muted">{when(e.created_at)} · {e.url}{e.user_id ? ` · ${phoneOf.get(e.user_id) ?? e.user_id.slice(0, 8)}` : ''}</small>
                  {e.detail && <details><summary>Details</summary><pre>{e.detail}</pre></details>}
                </li>
              ))}</ul>
            )}
          </>
        )}
      </section>
    </>
  )
}
