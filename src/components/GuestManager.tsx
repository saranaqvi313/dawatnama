'use client'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { activateGuests, addGuests, deleteGuests, markReminded, updateGuest } from '@/app/guestActions'
import { guestStats, invitedTo, replySummary, whatsappHref, type GuestRow, type ReplyRow } from '@/lib/guestStats'
import { readGuestFile } from '@/lib/sheet'
import { PRODUCTS, rupees } from '@/lib/pricing'
import QrButton from './QrButton'

type Card = { id: string; slug: string; kind: string; title: string; openLinkLive: boolean; opens: number }
type Props = { card: Card; initialGuests: GuestRow[]; replies: ReplyRow[]; eventNames: string[]; credits: number; siteUrl: string; payResult?: string }

const PAY: Record<string, string> = {
  paid: 'Payment received. Your new guest links are ready to use.',
  cancelled: 'Payment cancelled. You have not been charged.',
  failed: 'We could not confirm the payment. If money was taken from your card, contact us.',
  error: 'We could not start the payment. Please try again in a minute.',
  unavailable: 'Payments are not set up on this site yet.',
}

const SAMPLE = 'Name,Phone,Guests,Events\r\nAli Khan,03001234567,3,"Mehndi, Baraat"\r\nHina Ahmed,03211234567,2,\r\n'

export default function GuestManager({ card, initialGuests, replies, eventNames, credits, siteUrl, payResult }: Props) {
  const router = useRouter()
  const [guests, setGuests] = useState(initialGuests)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState(payResult ? PAY[payResult] ?? '' : '')
  const [busy, setBusy] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const stats = useMemo(() => guestStats(guests, replies, eventNames), [guests, replies, eventNames])
  const linkOf = (g: GuestRow) => `${siteUrl}/${g.slug}`
  const host = siteUrl.replace(/^https?:\/\//, '')
  const back = `/dashboard/${card.id}/guests`
  const editorHref = card.kind === 'canvas' ? `/design/${card.id}` : `/dashboard/${card.id}`

  const refresh = () => router.refresh()
  async function run<T>(key: string, fn: () => Promise<{ ok: boolean; error?: string; data?: T }>, done?: (data?: T) => string) {
    setBusy(key); setStatus('')
    const res = await fn()
    setBusy('')
    if (!res.ok) { setStatus(res.error ?? 'Something went wrong.'); return false }
    if (done) setStatus(done(res.data))
    refresh()
    return true
  }

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const events = eventNames.filter((n) => f.getAll('events').includes(n))
    const ok = await run('add', () => addGuests(card.id, [{
      name: String(f.get('name') || ''), phone: String(f.get('phone') || ''),
      party_size: Number(f.get('party') || 1), events: events.length === eventNames.length ? [] : events,
    }]), () => 'Guest added. Make their link live when you are ready to send it.')
    if (ok) form.reset()
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

  const selectedNotLive = guests.filter((g) => selected.has(g.id) && !g.link_active)
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const allSelected = guests.length > 0 && selected.size === guests.length

  async function goLive(ids: string[]) {
    const need = guests.filter((g) => ids.includes(g.id) && !g.link_active).length
    if (need > credits) { setStatus(`You need ${need} guest links and have ${credits}. Buy more below.`); return }
    const ok = await run('live', () => activateGuests(ids), (d) => `${(d as { used: number } | undefined)?.used ?? need} link${need === 1 ? ' is' : 's are'} live. Send them on WhatsApp.`)
    if (ok) { setGuests((gs) => gs.map((g) => (ids.includes(g.id) ? { ...g, link_active: true } : g))); setSelected(new Set()) }
  }

  async function remove(ids: string[]) {
    const live = guests.filter((g) => ids.includes(g.id) && g.link_active).length
    if (!window.confirm(live ? `Delete ${ids.length} guest(s)? ${live} live link(s) will stop working and the links are not refunded.` : `Delete ${ids.length} guest(s)?`)) return
    const ok = await run('delete', () => deleteGuests(ids), () => 'Deleted.')
    if (ok) { setGuests((gs) => gs.filter((g) => !ids.includes(g.id))); setSelected(new Set()) }
  }

  const inviteText = (g: GuestRow) => `Assalam o Alaikum ${g.name}! You are warmly invited to ${card.title}. Please open your invitation and let us know if you can come: ${linkOf(g)}`
  const remindText = (g: GuestRow) => `Assalam o Alaikum ${g.name}, a gentle reminder about ${card.title}. Please let us know if you can come: ${linkOf(g)}`

  async function onSaveEdit(e: FormEvent<HTMLFormElement>, g: GuestRow) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const events = eventNames.filter((n) => f.getAll('events').includes(n))
    const patch = { name: String(f.get('name') || ''), phone: String(f.get('phone') || ''), party_size: Number(f.get('party') || 1),
      events: events.length === eventNames.length ? [] : events, ...(g.link_active ? {} : { slug: String(f.get('slug') || g.slug) }) }
    const ok = await run('edit', () => updateGuest(g.id, patch), () => 'Saved.')
    if (ok) setEditing(null)
  }

  const eventChecks = (chosen: string[]) => eventNames.length > 1 && (
    <fieldset className="g-events"><legend>Invited to</legend>
      {eventNames.map((n) => (
        <label key={n} className="check"><input type="checkbox" name="events" value={n} defaultChecked={!chosen.length || chosen.includes(n)} />{n}</label>
      ))}
    </fieldset>
  )

  return (
    <section className="band dash guests-page">
      <div className="dash-head">
        <div>
          <Link href={editorHref}>← Back to the card</Link>
          <h2>Guests · <span dir="auto">{card.title}</span></h2>
        </div>
        <div className="credit-pill">
          <b>{credits}</b> guest link{credits === 1 ? '' : 's'} left
          <Link href={`/premium?return=${encodeURIComponent(back)}`} className="btn small">Buy links</Link>
        </div>
      </div>

      <div className="stats">
        <div><b>{stats.guests}</b><span>Guests ({stats.people} people)</span></div>
        <div><b>{stats.live}</b><span>Links live</span></div>
        <div><b>{stats.opened}</b><span>Opened the card</span></div>
        <div><b>{stats.replied}</b><span>Replied</span></div>
      </div>

      <h3 className="g-title">Who is coming</h3>
      <div className="table-wrap"><table className="food">
        <thead><tr><th>Function</th><th>Coming (people)</th><th>Maybe</th><th>Can&apos;t come</th><th>No reply yet</th></tr></thead>
        <tbody>
          {stats.perEvent.map((e) => (
            <tr key={e.event || 'all'}>
              <td dir="auto">{e.event || 'All'}</td>
              <td><b className="big">{e.coming}</b> <span className="muted">from {e.comingReplies} {e.comingReplies === 1 ? 'family' : 'families'}</span></td>
              <td>{e.maybe}</td><td>{e.declined}</td><td>{e.waiting}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className="muted small-note">“Coming” is the food headcount: the number of people guests said will attend each function.</p>

      <h3 className="g-title">Add guests</h3>
      <form className="g-add" onSubmit={onAdd}>
        <label>Name<input name="name" required maxLength={80} placeholder="Ali Khan" dir="auto" /></label>
        <label>WhatsApp number<input name="phone" type="tel" inputMode="tel" placeholder="0300 1234567" dir="ltr" /></label>
        <label>People<input name="party" type="number" min={1} max={50} defaultValue={1} /></label>
        {eventChecks([])}
        <button className="btn" disabled={busy === 'add'} aria-busy={busy === 'add'}>Add guest</button>
      </form>
      <div className="g-upload">
        <input ref={fileInput} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
        <button type="button" className="btn ghost" disabled={busy === 'upload'} aria-busy={busy === 'upload'} onClick={() => fileInput.current?.click()}>Upload Excel or CSV</button>
        <a className="link" href={`data:text/csv;charset=utf-8,${encodeURIComponent('﻿' + SAMPLE)}`} download="guest-list-sample.csv">Download a sample file</a>
        <span className="muted small-note">Columns: Name, Phone, Guests, Events. Only Name is required.</span>
      </div>

      {status && <p className="notice" role="status">{status}</p>}

      <div className="g-bar">
        <label className="check"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(guests.map((g) => g.id)))} />Select all</label>
        {selected.size > 0 && (
          <>
            {selectedNotLive.length > 0 && (
              <button className="btn small" disabled={busy === 'live'} aria-busy={busy === 'live'} onClick={() => goLive(selectedNotLive.map((g) => g.id))}>
                Make {selectedNotLive.length} link{selectedNotLive.length === 1 ? '' : 's'} live · uses {selectedNotLive.length}
              </button>
            )}
            <button className="btn ghost small" disabled={busy === 'delete'} aria-busy={busy === 'delete'} onClick={() => remove([...selected])}>Delete</button>
          </>
        )}
        {credits < Math.max(1, selectedNotLive.length) && (
          <span className="muted small-note">Need more links? <Link href={`/premium?return=${encodeURIComponent(back)}`}>5 links for {rupees(PRODUCTS.links5.price)}</Link></span>
        )}
      </div>

      {guests.length === 0 ? <p className="muted">No guests yet. Add them one by one or upload your list from Excel.</p> : (
        <ul className="g-list">
          {guests.map((g) => {
            const reply = replySummary(g.id, replies)
            return (
              <li key={g.id} className={g.link_active ? 'live' : ''}>
                <input type="checkbox" aria-label={`Select ${g.name}`} checked={selected.has(g.id)} onChange={() => toggle(g.id)} />
                {editing === g.id ? (
                  <form className="g-edit" onSubmit={(e) => onSaveEdit(e, g)}>
                    <label>Name<input name="name" defaultValue={g.name} required maxLength={80} dir="auto" /></label>
                    <label>WhatsApp<input name="phone" defaultValue={g.phone ?? ''} dir="ltr" /></label>
                    <label>People<input name="party" type="number" min={1} max={50} defaultValue={g.party_size} /></label>
                    {!g.link_active && <label>Link<span className="g-slug"><span dir="ltr">{host}/</span><input name="slug" defaultValue={g.slug} dir="ltr" /></span></label>}
                    {eventChecks(g.events)}
                    <div className="row-actions">
                      <button className="btn small" disabled={busy === 'edit'} aria-busy={busy === 'edit'}>Save</button>
                      <button type="button" className="btn ghost small" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="g-main">
                    <div className="g-who">
                      <b dir="auto">{g.name}</b>
                      <span className="muted">{g.party_size} {g.party_size === 1 ? 'person' : 'people'}{g.phone ? ` · ${g.phone}` : ''}{eventNames.length > 1 ? ` · ${g.events.length ? g.events.join(', ') : 'All functions'}` : ''}</span>
                    </div>
                    <div className="g-state">
                      {g.link_active ? (
                        <>
                          <span className="pill live">Live</span>
                          <span className={g.open_count ? 'ok' : 'muted'}>{g.open_count ? `Opened ${g.open_count}×` : 'Not opened yet'}</span>
                          {reply ? <span dir="auto">{reply}</span> : <span className="muted">No reply yet</span>}
                        </>
                      ) : <span className="pill">Link not live</span>}
                    </div>
                    <div className="g-actions">
                      {g.link_active ? (
                        <>
                          <a className="chip-btn wa" target="_blank" rel="noreferrer" href={whatsappHref(g.phone, inviteText(g))}>WhatsApp invite</a>
                          {!reply && <a className="chip-btn" target="_blank" rel="noreferrer" href={whatsappHref(g.phone, remindText(g))} onClick={() => { void markReminded([g.id]) }}>Remind{g.reminded_at ? ' again' : ''}</a>}
                          <button type="button" className="chip-btn" onClick={() => navigator.clipboard.writeText(linkOf(g)).then(() => setStatus(`Copied ${linkOf(g)}`))}>Copy link</button>
                          <QrButton link={linkOf(g)} fileName={`qr-${g.slug}`} />
                        </>
                      ) : (
                        <button type="button" className="chip-btn strong" disabled={busy === 'live'} onClick={() => goLive([g.id])}>Make live · 1 link</button>
                      )}
                      <button type="button" className="chip-btn" onClick={() => setEditing(g.id)}>Edit</button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {card.openLinkLive && (
        <p className="muted small-note">The card&apos;s open link {host}/{card.slug} has been opened {card.opens}×. Replies through it appear in the totals above.</p>
      )}
      {eventNames.length > 1 && guests.some((g) => eventNames.some((e) => !invitedTo(g, e))) && (
        <p className="muted small-note">Guests only see the functions they are invited to.</p>
      )}
    </section>
  )
}
