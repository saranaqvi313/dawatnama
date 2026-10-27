'use client'
import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Field from '@/components/Field'
import Icon from '@/components/Icon'
import Checkbox from '@/components/Checkbox'
import Modal from '@/components/Modal'
import Table from '@/components/Table'
import TableRow from '@/components/TableRow'
import Search from '@/components/Search'
import NoFound from '@/components/NoFound'
import DeleteItems from '@/components/DeleteItems'
import { activateGuests, addGuests, deleteGuests, markReminded, updateGuest } from '@/app/guestActions'
import { guestStats, invitedTo, replySummary, whatsappHref, type GuestRow, type ReplyRow } from '@/lib/guestStats'
import { readGuestFile } from '@/lib/sheet'
import { FREE_MODE, PRODUCTS, rupees } from '@/lib/pricing'
import QrButton from './QrButton'

type CardInfo = { id: string; slug: string; kind: string; title: string; openLinkLive: boolean; opens: number }
type Props = { card: CardInfo; initialGuests: GuestRow[]; replies: ReplyRow[]; eventNames: string[]; credits: number; siteUrl: string; payResult?: string }

const PAY: Record<string, string> = {
  paid: 'Payment received. Your new guest links are ready to use.',
  cancelled: 'Payment cancelled. You have not been charged.',
  failed: 'We could not confirm the payment. If money was taken from your card, contact us.',
  error: 'We could not start the payment. Please try again in a minute.',
  unavailable: 'Payments are not set up on this site yet.',
}

const SAMPLE = 'Name,Phone,Guests,Events\r\nAli Khan,03001234567,3,"Mehndi, Baraat"\r\nHina Ahmed,03211234567,2,\r\n'

type Draft = { name: string; phone: string; party: string; slug: string; events: string[] }
const emptyDraft = (events: string[]): Draft => ({ name: '', phone: '', party: '1', slug: '', events })

/** Events picker in kit checkboxes. */
function EventChecks({ eventNames, value, onChange }: { eventNames: string[]; value: string[]; onChange: (v: string[]) => void }) {
  if (eventNames.length < 2) return null
  return (
    <div>
      <div className="mb-4 text-button">Invited to</div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {eventNames.map((n) => (
          <Checkbox key={n} label={n} checked={value.includes(n)} onChange={(on) => onChange(on ? [...value, n] : value.filter((x) => x !== n))} />
        ))}
      </div>
    </div>
  )
}

/** One card's guest list: add or upload guests, make links live, send on WhatsApp, follow replies. */
export default function GuestManager({ card, initialGuests, replies, eventNames, credits, siteUrl, payResult }: Props) {
  const router = useRouter()
  const [guests, setGuests] = useState(initialGuests)
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState(payResult ? PAY[payResult] ?? '' : '')
  const [busy, setBusy] = useState('')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(eventNames))
  const [editing, setEditing] = useState<GuestRow | null>(null)
  const [edit, setEdit] = useState<Draft>(() => emptyDraft(eventNames))
  const fileInput = useRef<HTMLInputElement>(null)
  const stats = useMemo(() => guestStats(guests, replies, eventNames), [guests, replies, eventNames])
  const linkOf = (g: GuestRow) => `${siteUrl}/${g.slug}`
  const host = siteUrl.replace(/^https?:\/\//, '')
  const back = `/dashboard/${card.id}/guests`
  const editorHref = card.kind === 'canvas' ? `/design/${card.id}` : `/dashboard/${card.id}`
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? guests.filter((g) => `${g.name} ${g.phone ?? ''} ${g.slug}`.toLowerCase().includes(q)) : guests
  }, [guests, search])

  async function run<T>(key: string, fn: () => Promise<{ ok: boolean; error?: string; data?: T }>, done?: (data?: T) => string) {
    setBusy(key); setStatus('')
    const res = await fn()
    setBusy('')
    if (!res.ok) { setStatus(res.error ?? 'Something went wrong.'); return false }
    if (done) setStatus(done(res.data))
    router.refresh()
    return true
  }

  const eventsFor = (chosen: string[]) => {
    const ev = eventNames.filter((n) => chosen.includes(n))
    return ev.length === eventNames.length ? [] : ev
  }

  async function onAdd() {
    if (!draft.name.trim()) return setStatus('Enter the guest’s name.')
    const ok = await run('add', () => addGuests(card.id, [{
      name: draft.name, phone: draft.phone, party_size: Number(draft.party || 1), events: eventsFor(draft.events),
    }]), () => 'Guest added. Make their link live when you are ready to send it.')
    if (ok) setDraft(emptyDraft(eventNames))
  }

  async function onUpload(file: File | undefined) {
    if (!file) return
    setBusy('upload'); setStatus('Reading the file…')
    try {
      const list = await readGuestFile(file)
      if (!list.length) { setStatus('No guest names found. The first column (or a column called Name) should have the names.'); setBusy(''); return }
      await run('upload', () => addGuests(card.id, list.map((g) => ({ ...g, events: (g.events ?? []).filter((e) => eventNames.some((n) => n.toLowerCase() === e.toLowerCase())).map((e) => eventNames.find((n) => n.toLowerCase() === e.toLowerCase())!) }))),
        (d) => `${(d as { added: number } | undefined)?.added ?? list.length} guests added from ${file.name}.`)
    } catch (err) { setStatus((err as Error).message); setBusy('') }
    if (fileInput.current) fileInput.current.value = ''
  }

  const selectedNotLive = guests.filter((g) => selected.includes(g.id) && !g.link_active)
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const allSelected = shown.length > 0 && shown.every((g) => selected.includes(g.id))

  async function goLive(ids: string[]) {
    const need = guests.filter((g) => ids.includes(g.id) && !g.link_active).length
    if (!FREE_MODE && need > credits) { setStatus(`You need ${need} guest link${need === 1 ? '' : 's'} and have ${credits}. Buy more first.`); return }
    const ok = await run('live', () => activateGuests(ids), (d) => `${(d as { used: number } | undefined)?.used ?? need} link${need === 1 ? ' is' : 's are'} live. Send them on WhatsApp.`)
    if (ok) { setGuests((gs) => gs.map((g) => (ids.includes(g.id) ? { ...g, link_active: true } : g))); setSelected([]) }
  }

  async function remove(ids: string[]) {
    const ok = await run('delete', () => deleteGuests(ids), () => 'Deleted.')
    if (ok) { setGuests((gs) => gs.filter((g) => !ids.includes(g.id))); setSelected([]) }
  }

  const inviteText = (g: GuestRow) => `Assalam o Alaikum ${g.name}! You are warmly invited to ${card.title}. Please open your invitation and let us know if you can come: ${linkOf(g)}`
  const remindText = (g: GuestRow) => `Assalam o Alaikum ${g.name}, a gentle reminder about ${card.title}. Please let us know if you can come: ${linkOf(g)}`

  function startEdit(g: GuestRow) {
    setEditing(g)
    setEdit({ name: g.name, phone: g.phone ?? '', party: String(g.party_size), slug: g.slug, events: g.events.length ? g.events : eventNames })
  }
  async function saveEdit() {
    if (!editing) return
    const g = editing
    const patch = { name: edit.name, phone: edit.phone, party_size: Number(edit.party || 1), events: eventsFor(edit.events), ...(g.link_active ? {} : { slug: edit.slug || g.slug }) }
    const ok = await run('edit', () => updateGuest(g.id, patch), () => 'Saved.')
    if (ok) {
      setGuests((gs) => gs.map((x) => (x.id === g.id ? { ...x, name: patch.name, phone: patch.phone || null, party_size: patch.party_size, events: patch.events, slug: patch.slug ?? x.slug } : x)))
      setEditing(null)
    }
  }

  const buyHref = `/premium?return=${encodeURIComponent(back)}`

  return (
    <>
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 pl-5 max-lg:pl-3">
          <div className="mr-auto min-w-0">
            <div className="text-h6 truncate" dir="auto">{card.title}</div>
            <div className="text-body-2 text-t-secondary">{FREE_MODE ? 'Guest links are free. Add your guests and send each one their own link.' : `${credits} guest link${credits === 1 ? '' : 's'} left · ${rupees(PRODUCTS.links1.price)} each, less in bundles`}</div>
          </div>
          <Button isStroke as="link" href={editorHref} icon="edit" className="gap-2">Edit card</Button>
          <Button isStroke as="link" href={`/dashboard/${card.id}/rsvps`}>Replies</Button>
          {!FREE_MODE && <Button isBlack as="link" href={buyHref}>Buy links</Button>}
        </div>
        <div className="grid grid-cols-4 gap-3 p-2 pt-5 max-md:grid-cols-2">
          {([['Guests', stats.guests, `${stats.people} people`], ['Links live', stats.live, FREE_MODE ? 'ready to send' : `${credits} left to use`], ['Opened', stats.opened, 'opened their card'], ['Replied', stats.replied, 'sent an RSVP']] as const).map(([label, value, note]) => (
            <div key={label} className="p-5 rounded-3xl border border-s-subtle bg-b-depth2 max-md:p-4">
              <div className="mb-2 text-sub-title-1 text-t-secondary">{label}</div>
              <div className="text-h3 max-md:text-h4">{value}</div>
              <div className="mt-1 text-caption text-t-secondary">{note}</div>
            </div>
          ))}
        </div>
      </div>

      {status && (
        <div className="card !py-2"><div className="flex items-center gap-3 px-3 text-body-2" role="status"><Icon className="shrink-0 fill-t-secondary" name="info" />{status}</div></div>
      )}

      <div className="flex max-lg:block">
        <div className="col-left">
          <div className="card">
            {selected.length === 0 ? (
              <div className="flex items-center">
                <div className="pl-5 text-h6 max-lg:pl-3 max-md:mr-auto">Guest list</div>
                <Search className="w-70 ml-6 mr-auto max-md:hidden" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests" isGray />
                <Button isStroke className="gap-2" icon="upload" onClick={() => fileInput.current?.click()} disabled={busy === 'upload'} aria-busy={busy === 'upload' || undefined}>Upload Excel</Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="mr-3 pl-5 text-h6 max-lg:pl-3">{selected.length} guest{selected.length !== 1 ? 's' : ''} selected</div>
                <Button className="mr-auto" isStroke onClick={() => setSelected([])}>Deselect</Button>
                <DeleteItems counter={selected.length} isLargeButton onDelete={() => remove(selected)}
                  content={`Delete ${selected.length} guest${selected.length !== 1 ? 's' : ''}? Live links stop working and used links are not refunded.`} />
                {selectedNotLive.length > 0 && (
                  <Button isBlack onClick={() => goLive(selectedNotLive.map((g) => g.id))} disabled={busy === 'live'} aria-busy={busy === 'live' || undefined}>
                    {FREE_MODE ? `Make ${selectedNotLive.length} link${selectedNotLive.length === 1 ? '' : 's'} live` : `Make ${selectedNotLive.length} live · uses ${selectedNotLive.length}`}
                  </Button>
                )}
              </div>
            )}
            <input ref={fileInput} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
            {guests.length === 0 ? (
              <div className="pt-16 pb-20 text-center max-md:py-12">
                <div className="inline-block mb-2 text-h4">No guests yet</div>
                <div className="max-w-120 mx-auto text-sub-title-1 text-t-tertiary">Add them one by one, or upload your list from Excel. Columns: Name, Phone, Guests, Events.</div>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  <Button isStroke as="a" href={`data:text/csv;charset=utf-8,${encodeURIComponent('﻿' + SAMPLE)}`} download="guest-list-sample.csv">Download a sample file</Button>
                </div>
              </div>
            ) : shown.length === 0 ? (
              <NoFound title="No guests found" />
            ) : (
              <div className="p-1 pt-3 max-lg:px-0">
                <Table selectAll={allSelected} onSelectAll={() => setSelected(allSelected ? [] : shown.map((g) => g.id))}
                  cellsThead={['Guest', 'Link', 'Opened', 'Reply'].map((h) => <th key={h} className="max-lg:last:hidden">{h}</th>)}>
                  {shown.map((g) => {
                    const reply = replySummary(g.id, replies)
                    return (
                      <TableRow key={g.id} selectedRows={selected.includes(g.id)} onRowSelect={() => toggle(g.id)}>
                        <td>
                          <div className="pt-0.5 text-sub-title-1" dir="auto">{g.name}</div>
                          <div className="relative min-h-6">
                            <div className="absolute top-0 left-0 truncate max-w-full text-caption text-t-secondary/80 transition-all group-hover:invisible group-hover:opacity-0 max-lg:hidden">
                              {g.party_size} {g.party_size === 1 ? 'person' : 'people'}{g.phone ? ` · ${g.phone}` : ''}{eventNames.length > 1 ? ` · ${g.events.length ? g.events.join(', ') : 'All functions'}` : ''}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-0.5 -ml-1 invisible opacity-0 transition-all group-hover:visible group-hover:opacity-100 max-lg:visible max-lg:opacity-100">
                              {g.link_active ? (
                                <>
                                  <a className="action" target="_blank" rel="noreferrer" href={whatsappHref(g.phone, inviteText(g))}><Icon name="send" />WhatsApp</a>
                                  {!reply && <a className="action" target="_blank" rel="noreferrer" href={whatsappHref(g.phone, remindText(g))} onClick={() => { void markReminded([g.id]) }}><Icon name="bell" />Remind{g.reminded_at ? ' again' : ''}</a>}
                                  <button type="button" className="action" onClick={() => navigator.clipboard.writeText(linkOf(g)).then(() => setStatus(`Copied ${linkOf(g)}`))}><Icon name="link" />Copy</button>
                                  <QrButton link={linkOf(g)} fileName={`qr-${g.slug}`} />
                                </>
                              ) : (
                                <button type="button" className="action !text-t-primary" disabled={busy === 'live'} onClick={() => goLive([g.id])}><Icon name="check-circle" />{FREE_MODE ? 'Make link live' : 'Make live · 1 link'}</button>
                              )}
                              <button type="button" className="action" onClick={() => startEdit(g)}><Icon name="edit" />Edit</button>
                            </div>
                          </div>
                        </td>
                        <td className="max-md:hidden whitespace-nowrap">{g.link_active ? <span className="label label-green">Live</span> : <span className="label label-gray">Not live</span>}</td>
                        <td className="max-md:hidden whitespace-nowrap">{g.link_active ? (g.open_count ? <span>{g.open_count}×</span> : <span className="text-t-secondary">Not yet</span>) : '—'}</td>
                        <td className="max-lg:hidden max-w-60" dir="auto">{reply || <span className="text-t-secondary">{g.link_active ? 'No reply yet' : '—'}</span>}</td>
                      </TableRow>
                    )
                  })}
                </Table>
              </div>
            )}
            {(card.openLinkLive || (eventNames.length > 1 && guests.some((g) => eventNames.some((e) => !invitedTo(g, e))))) && (
              <div className="flex flex-col gap-1 px-5 pt-3 pb-2 text-caption text-t-secondary max-lg:px-3">
                {card.openLinkLive && <span>The card&apos;s open link {host}/{card.slug} has been opened {card.opens}×. Replies through it appear in the totals.</span>}
                {eventNames.length > 1 && <span>Guests only see the functions they are invited to.</span>}
              </div>
            )}
          </div>
        </div>

        <div className="col-right">
          <Card title="Add a guest">
            <div className="flex flex-col gap-6 px-5 pb-5 max-lg:px-3 max-lg:pb-3">
              <Field innerLabel="Name" placeholder="Ali Khan" maxLength={80} dir="auto" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
              <div className="flex gap-3">
                <Field className="flex-1" innerLabel="WhatsApp number" placeholder="0300 1234567" type="tel" inputMode="tel" dir="ltr" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                <Field className="w-28" innerLabel="People" type="number" min={1} max={50} value={draft.party} onChange={(e) => setDraft({ ...draft, party: e.target.value })} />
              </div>
              <EventChecks eventNames={eventNames} value={draft.events} onChange={(events) => setDraft({ ...draft, events })} />
              <Button isBlack onClick={onAdd} disabled={busy === 'add'} aria-busy={busy === 'add' || undefined}>Add guest</Button>
              <div className="text-caption text-t-secondary">
                Have a list? <button type="button" className="text-t-primary font-bold transition-colors hover:text-primary-01" onClick={() => fileInput.current?.click()}>Upload Excel or CSV</button> ·{' '}
                <a className="text-t-primary font-bold transition-colors hover:text-primary-01" href={`data:text/csv;charset=utf-8,${encodeURIComponent('﻿' + SAMPLE)}`} download="guest-list-sample.csv">sample file</a>
              </div>
            </div>
          </Card>

          <Card title="Who is coming">
            <div className="px-5 pb-2 max-lg:px-3">
              {stats.perEvent.map((e) => (
                <div key={e.event || 'all'} className="py-5 border-b border-s-subtle last:border-b-0">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="text-sub-title-1" dir="auto">{e.event || 'All functions'}</div>
                    <div className="text-h5">{e.coming}<span className="ml-1 text-caption text-t-secondary">people</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="label label-green">{e.comingReplies} {e.comingReplies === 1 ? 'family' : 'families'} coming</span>
                    {e.maybe > 0 && <span className="label label-yellow">{e.maybe} maybe</span>}
                    {e.declined > 0 && <span className="label label-red">{e.declined} can&apos;t come</span>}
                    <span className="label label-gray">{e.waiting} no reply</span>
                  </div>
                </div>
              ))}
              <div className="pb-3 text-caption text-t-secondary">“Coming” is the food headcount: the number of people guests said will attend each function.</div>
            </div>
          </Card>
          {!FREE_MODE && credits < Math.max(1, selectedNotLive.length) && (
            <div className="card">
              <div className="p-3 text-body-2 text-t-secondary">Need more links? <Link className="text-t-primary font-bold hover:text-primary-01" href={buyHref}>5 links for {rupees(PRODUCTS.links5.price)}</Link></div>
            </div>
          )}
        </div>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)}>
        <div className="mb-8 text-h4 max-md:text-h5">Edit guest</div>
        <div className="flex flex-col gap-6">
          <Field innerLabel="Name" maxLength={80} dir="auto" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
          <div className="flex gap-3">
            <Field className="flex-1" innerLabel="WhatsApp" type="tel" dir="ltr" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
            <Field className="w-28" innerLabel="People" type="number" min={1} max={50} value={edit.party} onChange={(e) => setEdit({ ...edit, party: e.target.value })} />
          </div>
          {editing && !editing.link_active && (
            <Field innerLabel={`Link · ${host}/`} dir="ltr" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} />
          )}
          <EventChecks eventNames={eventNames} value={edit.events} onChange={(events) => setEdit({ ...edit, events })} />
        </div>
        <div className="flex gap-3 mt-8">
          <Button className="flex-1" isStroke onClick={() => setEditing(null)}>Cancel</Button>
          <Button className="flex-1" isBlack onClick={saveEdit} disabled={busy === 'edit'} aria-busy={busy === 'edit' || undefined}>Save</Button>
        </div>
      </Modal>
    </>
  )
}
