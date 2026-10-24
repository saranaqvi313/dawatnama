import Link from 'next/link'
import { redirect } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Table from '@/components/Table'
import TableRow from '@/components/TableRow'
import CardThumb from '@/components/dawat/CardThumb'
import RecentReplies from '@/components/dawat/RecentReplies'
import { loadMyCards } from '@/lib/myCards'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'Guests — Dawatnama' }
export const dynamic = 'force-dynamic'

export default async function GuestsOverview() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/guests')
  const { cards, replies, totals } = await loadMyCards(await createClient(), viewer.id)
  const stats = [
    ['Guests', totals.guests, `${totals.people} people`],
    ['Links live', totals.guestsLive, `${viewer.credits} link${viewer.credits === 1 ? '' : 's'} left to use`],
    ['Replies', totals.replies, `${totals.coming} people coming`],
    ['Opens', totals.opens, `${totals.opened} opened their card`],
  ] as const
  return (
    <Shell title="Guests" viewer={viewer}>
      <div className="flex max-lg:block">
        <div className="col-left">
          <Card title="Guests overview" headContent={<Button className="mr-1" isBlack as="link" href="/premium?return=/guests">Buy links</Button>}>
            <div className="grid grid-cols-4 gap-3 p-2 pt-0 max-2xl:grid-cols-2">
              {stats.map(([label, value, note]) => (
                <div key={label} className="p-5 rounded-3xl border border-s-subtle bg-b-depth2 max-md:p-4">
                  <div className="mb-2 text-sub-title-1 text-t-secondary">{label}</div>
                  <div className="text-h3 max-md:text-h4">{value}</div>
                  <div className="mt-1 text-caption text-t-secondary">{note}</div>
                </div>
              ))}
            </div>
          </Card>
          <div className="card">
            <div className="flex items-center h-12 pl-5 max-lg:pl-3">
              <div className="mr-auto text-h6">Guest lists by card</div>
            </div>
            {cards.length === 0 ? (
              <div className="pt-12 pb-16 text-center">
                <div className="mb-2 text-h5">No cards yet</div>
                <div className="mb-6 text-body-2 text-t-secondary">Make a card first, then add your guests to it.</div>
                <Button isBlack as="link" href="/templates">Choose a template</Button>
              </div>
            ) : (
              <div className="p-1 pt-3 max-lg:px-0">
                <Table cellsThead={['Card', 'Guests', 'Links live', 'Opened', 'Coming', ''].map((h, i) => <th key={i} className="max-lg:nth-4:hidden max-lg:nth-5:hidden">{h}</th>)}>
                  {cards.map((c) => (
                    <TableRow key={c.id}>
                      <td>
                        <Link href={`/dashboard/${c.id}/guests`} className="inline-flex items-center">
                          <CardThumb title={c.title} design={c.design} canvas={c.canvas} className="size-16 shrink-0 rounded-xl" />
                          <span className="pl-5 max-md:pl-4">
                            <span className="block text-sub-title-1" dir="auto">{c.title}</span>
                            <span className="block text-caption text-t-secondary/80">{c.eventType || 'Invitation'} · {c.published ? 'Live' : 'Draft'}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="max-md:hidden">{c.guests}</td>
                      <td className="max-md:hidden">{c.guestsLive}</td>
                      <td className="max-lg:hidden">{c.guestsOpened}</td>
                      <td className="max-lg:hidden">{c.coming}</td>
                      <td className="text-right">
                        <Button className="!h-10 !px-4" isStroke as="link" href={`/dashboard/${c.id}/guests`}>Manage</Button>
                      </td>
                    </TableRow>
                  ))}
                </Table>
              </div>
            )}
          </div>
        </div>
        <div className="col-right">
          <RecentReplies replies={replies.slice(0, 8)} />
        </div>
      </div>
    </Shell>
  )
}
