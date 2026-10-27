'use client'
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Search from '@/components/Search'
import Tabs from '@/components/Tabs'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import Table from '@/components/Table'
import TableRow from '@/components/TableRow'
import DeleteItems from '@/components/DeleteItems'
import NoFound from '@/components/NoFound'
import { deleteInvitations } from '@/app/actions'
import type { CardRow } from '@/lib/myCards'
import CardThumb from './CardThumb'
import GridCard, { Grid } from './GridCard'

const views = [
  { id: 1, name: 'grid' },
  { id: 2, name: 'list' },
]

const status = (c: CardRow) => (c.published ? <div className="label label-green">Live</div> : <div className="label label-gray">Draft</div>)

/** The person's cards, in the kit's "Released products" layout (list or grid, search, bulk delete). */
export default function InvitationsBoard({ cards, title = 'Invitations', compact, siteUrl, grid }: { cards: CardRow[]; title?: string; compact?: boolean; siteUrl: string; grid?: boolean }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [view, setView] = useState(grid ? views[0] : views[1])
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? cards.filter((c) => `${c.title} ${c.eventType} ${c.slug}`.toLowerCase().includes(q)) : cards
  }, [cards, search])
  const allSelected = shown.length > 0 && shown.every((c) => selected.includes(c.id))
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const remove = (ids: string[]) => start(async () => {
    setError('')
    const res = await deleteInvitations(ids)
    if (!res.ok) { setError(res.error ?? 'Could not delete.'); return }
    setSelected([]); router.refresh()
  })
  const host = siteUrl.replace(/^https?:\/\//, '')

  const actions = (c: CardRow) => (
    <>
      <Link className="action" href={c.editHref}><Icon name="edit" />Edit</Link>
      {c.kind === 'canvas' && <Link className="action" href={`/design/${c.id}/preview`} target="_blank"><Icon name="video" />Preview</Link>}
      <Link className="action" href={`/dashboard/${c.id}/guests`}><Icon name="profile" />Guests</Link>
      {c.published && <a className="action" href={`/${c.slug}`} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" />View</a>}
      <DeleteItems onDelete={() => remove([c.id])} content={`This will delete "${c.title}", its guest list and replies. Live links stop working and used links are not refunded. This cannot be undone.`} />
    </>
  )

  return (
    <div className="card">
      {selected.length === 0 ? (
        <div className="flex items-center">
          <div className="pl-5 text-h6 max-lg:pl-3 max-md:mr-auto">{title}</div>
          {!compact && (
            <Search className="w-70 ml-6 mr-auto max-md:hidden" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invitations" isGray />
          )}
          {compact ? (
            <Button className="ml-auto" isStroke as="link" href="/invitations">See all</Button>
          ) : (
            search === '' && <Tabs items={views} value={view} setValue={setView} isOnlyIcon />
          )}
        </div>
      ) : (
        <div className="flex items-center flex-wrap gap-y-3">
          <div className="mr-6 pl-5 text-h6 max-lg:pl-3">{selected.length} invitation{selected.length !== 1 ? 's' : ''} selected</div>
          <Button className="mr-auto" isStroke onClick={() => setSelected([])}>Deselect</Button>
          <DeleteItems counter={selected.length} isLargeButton onDelete={() => remove(selected)}
            content={`This will delete ${selected.length} invitation${selected.length !== 1 ? 's' : ''} with their guest lists and replies. This cannot be undone.`} />
        </div>
      )}
      {error && <div className="mx-5 mt-3 label label-red">{error}</div>}
      {pending && <div className="mx-5 mt-3 text-caption text-t-secondary">Deleting…</div>}
      {cards.length === 0 ? (
        <div className="pt-16 pb-20 text-center max-md:py-12">
          <div className="inline-block mb-2 text-h4">No invitations yet</div>
          <div className="mb-8 text-sub-title-1 text-t-tertiary">Pick a design or start from a blank card. It&apos;s free.</div>
          <Button isBlack as="link" href="/templates">Make my first card</Button>
        </div>
      ) : shown.length === 0 ? (
        <NoFound title="No invitations found" />
      ) : view.id === 1 && !compact ? (
        <div className="p-5 pt-3 max-lg:p-3">
          <Grid>
            {shown.map((c) => (
              <GridCard key={c.id} title={c.title} badge={status(c)}
                details={`${c.eventType || 'Invitation'}${c.kind === 'canvas' ? ' · Designer card' : ''} · ${c.replies} repl${c.replies === 1 ? 'y' : 'ies'}`}
                thumb={<Link href={c.editHref} className="block size-full"><CardThumb title={c.title} design={c.design} canvas={c.canvas} className="size-full" /></Link>}
                actions={actions(c)} />
            ))}
          </Grid>
        </div>
      ) : (
        <div className="p-1 pt-3 max-lg:px-0">
          <Table selectAll={allSelected} onSelectAll={() => setSelected(allSelected ? [] : shown.map((c) => c.id))}
            cellsThead={['Invitation', 'Status', 'Guest links', 'Coming', 'Opens'].map((h) => (
              <th key={h} className="max-lg:nth-5:hidden max-lg:last:hidden">{h}</th>
            ))}>
            {(compact ? shown.slice(0, 5) : shown).map((c) => (
              <TableRow key={c.id} selectedRows={selected.includes(c.id)} onRowSelect={() => toggle(c.id)}>
                <td>
                  <div className="inline-flex items-center">
                    <Link href={c.editHref} className="relative z-2 shrink-0">
                      <CardThumb title={c.title} design={c.design} canvas={c.canvas} className="size-16 rounded-xl max-md:size-18" />
                    </Link>
                    <div className="max-w-69 pl-5 max-md:max-w-fit max-md:pl-4">
                      <div className="pt-0.5 text-sub-title-1 max-md:pt-0 max-md:line-clamp-1" dir="auto">{c.title}</div>
                      <div className="relative">
                        <div className="absolute top-0 left-0 truncate text-caption text-t-secondary/80 transition-all group-hover:invisible group-hover:opacity-0 max-lg:hidden">
                          {c.eventType || 'Invitation'}{c.kind === 'canvas' ? ' · Designer card' : ''} · {c.published ? `${host}/${c.slug}` : 'link not live'}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-0.5 -ml-1 invisible opacity-0 transition-all group-hover:visible group-hover:opacity-100 max-lg:visible max-lg:opacity-100 max-md:mt-2 max-md:gap-0">
                          {actions(c)}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="max-md:hidden">{status(c)}</td>
                <td className="max-md:hidden">{c.guestsLive}<span className="text-t-secondary"> / {c.guests}</span></td>
                <td className="max-md:hidden max-lg:hidden">
                  <div className="inline-flex items-center gap-2">
                    <div className="min-w-8">{c.coming}</div>
                    <span className="text-caption text-t-secondary">{c.replies} repl{c.replies === 1 ? 'y' : 'ies'}</span>
                  </div>
                </td>
                <td className="max-lg:hidden">
                  <div className="inline-flex items-center gap-2">
                    <div className="min-w-8">{c.opens + c.guestsOpened}</div>
                    <div className="relative w-8 h-1.5 rounded-[2px] bg-shade-07/40">
                      <div className="absolute top-0 left-0 bottom-0 rounded-[2px] bg-chart-green" style={{ width: `${c.guests ? Math.round((c.guestsOpened / c.guests) * 100) : c.opens ? 100 : 0}%` }} />
                    </div>
                  </div>
                </td>
              </TableRow>
            ))}
          </Table>
        </div>
      )}
    </div>
  )
}
