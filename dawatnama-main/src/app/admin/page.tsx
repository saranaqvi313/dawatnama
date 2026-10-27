import Link from 'next/link'
import { notFound } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import SubmitButton from '@/components/dawat/SubmitButton'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Table from '@/components/Table'
import TableRow from '@/components/TableRow'
import Field from '@/components/Field'
import { adminState } from '@/lib/admin'
import { rupees } from '@/lib/pricing'
import { createAdminClient } from '@/lib/supabase/admin'
import { clearErrors, grantToUser, resetUserPassword, unlockAdmin } from './actions'

export const metadata = { title: 'Admin — Dawatnama', robots: { index: false } }
export const dynamic = 'force-dynamic'

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const small = 'h-10 px-4 border border-s-stroke2 rounded-full text-body-2 text-t-primary outline-none transition-colors hover:border-s-highlight focus:border-s-highlight placeholder:text-t-secondary/50'
const head = (cols: string[]) => cols.map((h, i) => <th key={i}>{h}</th>)

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; wrong?: string; pwok?: string; pwerr?: string }> }) {
  const sp = await searchParams
  const { state } = await adminState()
  if (state === 'no') notFound()
  if (state !== 'ok') return (
    <Shell title="Admin">
      <div className="w-full max-w-120 mx-auto mt-6 p-16 bg-b-surface2 rounded-3xl shadow-depth max-md:mt-0 max-md:p-6">
        <div className="mb-10 text-h4 text-center max-md:mb-6 max-md:text-h5">Admin</div>
        {state === 'no-password' ? (
          <div className="text-center text-body-2 text-primary-03">Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy. The admin page stays closed until then.</div>
        ) : (
          <form action={unlockAdmin}>
            <Field innerLabel="Admin password" name="password" type="password" required autoComplete="current-password" placeholder="Enter admin password" />
            <SubmitButton className="mt-6 w-full" isBlack>Open admin</SubmitButton>
            {sp.wrong && <div className="mt-4 text-center text-caption text-primary-03" role="alert">Wrong password.</div>}
          </form>
        )}
      </div>
    </Shell>
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
  const tiles = [
    ['Users', `${users.length}${users.length === 200 ? '+' : ''}`, 'signed up'],
    ['Card payments', rupees(revenue), 'received'],
    ['Cards', String(cards), `${liveCards} with open link live`],
    ['Guest links live', String(liveGuests), `of ${guests} guests`],
    ['RSVP replies', String(rsvps), 'all cards'],
    ['Errors logged', String(errorsCount), 'see the Errors tab'],
  ]

  return (
    <Shell title="Admin">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 mr-auto max-md:w-full max-md:overflow-x-auto max-md:scrollbar-none">
            {tabs.map(([k, l]) => (
              <Link key={k} href={`/admin?tab=${k}`}
                className={`flex shrink-0 justify-center items-center h-12 px-5.5 rounded-full border text-button transition-colors hover:text-t-primary ${tab === k ? 'border-s-stroke2 text-t-primary' : 'border-transparent text-t-secondary'}`}>{l}</Link>
            ))}
          </div>
          <Button isStroke as="a" href="/admin/backup" icon="upload" className="gap-2">Download backup (JSON)</Button>
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-3 gap-3 p-2 pt-5 max-xl:grid-cols-2 max-md:grid-cols-1">
            {tiles.map(([label, value, note]) => (
              <div key={label} className="p-6 rounded-3xl border border-s-subtle bg-b-depth2">
                <div className="mb-2 text-sub-title-1 text-t-secondary">{label}</div>
                <div className="text-h3 max-md:text-h4">{value}</div>
                <div className="mt-1 text-caption text-t-secondary">{note}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'payments' && (
          <div className="p-1 pt-3 overflow-x-auto max-lg:px-0">
            <Table isMobileVisibleTHead cellsThead={head(['When', 'User', 'Product', 'Amount', 'Method', 'Status', 'Order'])}>
              {(payments ?? []).map((p) => (
                <TableRow key={p.id}>
                  <td>{when(p.created_at)}</td><td dir="ltr">{phoneOf.get(p.user_id) || p.user_id.slice(0, 8)}</td><td>{p.product ?? p.purpose}</td><td>{rupees(p.amount_pkr)}</td><td>{p.method}</td>
                  <td><span className={`label ${p.status === 'paid' ? 'label-green' : p.status === 'failed' ? 'label-red' : 'label-gray'}`}>{p.status}</span></td>
                  <td dir="ltr" className="text-caption text-t-secondary">{p.order_ref}</td>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {tab === 'users' && (
          <div className="pt-3">
            {sp.pwok && <div className="mx-3 mb-3 label label-green !h-auto py-1.5">Password changed. Tell the user their new password, and ask them to keep it private.</div>}
            {sp.pwerr && <div className="mx-3 mb-3 label label-red !h-auto py-1.5">{sp.pwerr}</div>}
            <div className="p-1 overflow-x-auto max-lg:px-0">
              <Table isMobileVisibleTHead cellsThead={head(['Phone', 'Name', 'Joined', 'Last sign-in', 'Premium', 'Links', 'Give', 'New password'])}>
                {users.map((u) => {
                  const p = profileOf.get(u.id)
                  return (
                    <TableRow key={u.id}>
                      <td dir="ltr" className="whitespace-nowrap">{phoneOf.get(u.id) || '—'}</td><td dir="auto">{String(u.user_metadata?.full_name ?? '')}</td>
                      <td className="whitespace-nowrap">{when(u.created_at)}</td><td className="whitespace-nowrap">{when(u.last_sign_in_at)}</td>
                      <td>{p?.is_premium ? <span className="label label-green">Yes</span> : '—'}</td><td>{p?.link_credits ?? 0}</td>
                      <td>
                        <form action={grantToUser} className="flex items-center gap-2">
                          <input type="hidden" name="user_id" value={u.id} />
                          <input name="credits" type="number" min={0} max={1000} placeholder="Links" aria-label="Links to add" className={`${small} w-24`} />
                          <label className="flex items-center gap-2 text-caption whitespace-nowrap"><input type="checkbox" name="premium" className="size-4 accent-primary-01" />Premium</label>
                          <SubmitButton className="!h-10 !px-4" isBlack>Add</SubmitButton>
                        </form>
                      </td>
                      <td>
                        <form action={resetUserPassword} className="flex items-center gap-2">
                          <input type="hidden" name="user_id" value={u.id} />
                          <input name="password" type="text" minLength={10} maxLength={72} placeholder="New password" aria-label="New password" autoComplete="off" className={`${small} w-40`} />
                          <SubmitButton className="!h-10 !px-4" isStroke>Set</SubmitButton>
                        </form>
                      </td>
                    </TableRow>
                  )
                })}
              </Table>
            </div>
            <div className="px-5 pt-3 text-caption text-t-secondary">Showing the newest 200 users. “Give” adds links or Premium for free, e.g. to fix a payment problem.</div>
          </div>
        )}

        {tab === 'cards' && (
          <div className="p-1 pt-3 overflow-x-auto max-lg:px-0">
            <Table isMobileVisibleTHead cellsThead={head(['Created', 'Card', 'Owner', 'Link', 'Opens'])}>
              {(recentCards ?? []).map((c) => {
                const ct = (c.content ?? {}) as { name1?: string; name2?: string; eventType?: string }
                return (
                  <TableRow key={c.id}>
                    <td className="whitespace-nowrap">{when(c.created_at)}</td>
                    <td dir="auto">{[ct.name1, ct.name2].filter(Boolean).join(' & ') || ct.eventType}{c.kind === 'canvas' ? <span className="ml-2 label label-gray">designer</span> : null}</td>
                    <td dir="ltr">{phoneOf.get(c.user_id) || '—'}</td>
                    <td>{c.published && c.share_paid ? <a className="text-t-blue" href={`/${c.slug}`} target="_blank" rel="noreferrer">/{c.slug}</a> : <span className="text-t-secondary">/{c.slug}</span>}</td>
                    <td>{c.open_count ?? 0}</td>
                  </TableRow>
                )
              })}
            </Table>
          </div>
        )}

        {tab === 'errors' && (
          <div className="pt-5">
            <form action={clearErrors} className="px-2"><SubmitButton isStroke>Clear all errors</SubmitButton></form>
            {(errors ?? []).length === 0 ? <div className="px-5 py-10 text-center text-body-2 text-t-secondary">No errors logged. 🎉</div> : (
              <div className="flex flex-col gap-1 mt-3">
                {(errors ?? []).map((e) => (
                  <div key={e.id} className="group relative px-3 py-5">
                    <div className="box-hover"></div>
                    <div className="relative z-2">
                      <div className="flex flex-wrap items-center gap-2 mb-1"><span className="label label-gray">{e.source}</span><span className="text-sub-title-1">{e.message}</span></div>
                      <div className="text-caption text-t-tertiary">{when(e.created_at)} · {e.url}{e.user_id ? ` · ${phoneOf.get(e.user_id) ?? e.user_id.slice(0, 8)}` : ''}</div>
                      {e.detail && <details className="mt-2"><summary className="text-caption text-t-secondary cursor-pointer">Details</summary><pre className="mt-2 p-3 max-h-65 overflow-auto rounded-xl bg-b-surface1 text-caption whitespace-pre-wrap">{e.detail}</pre></details>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}
