'use client'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import Effects from './Effects'
import Scene from './Scene'
import { cardText } from '@/lib/i18n'
import { FONTS, type Content, type Design, type EventItem } from '@/lib/types'
import { submitGuestRsvp, submitRsvp } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { videoEmbed } from '@/lib/media'

export type CardGuest = { id: string; name: string; party_size: number; events: string[]; slug: string }

function artwork(kind: string, accent: string) {
  const c = encodeURIComponent(accent)
  const svg = (w: number, h: number, body: string) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' fill='none' stroke='${c}' stroke-opacity='.22'%3E${body}%3C/svg%3E")`
  if (kind === 'geometric')
    return svg(80, 80, "%3Cpath d='M40 4 52 28 76 40 52 52 40 76 28 52 4 40 28 28Z'/%3E%3Crect x='20' y='20' width='40' height='40' transform='rotate(45 40 40)'/%3E")
  if (kind === 'floral')
    return svg(90, 90, "%3Ccircle cx='45' cy='45' r='5'/%3E%3Cellipse cx='45' cy='27' rx='7' ry='13'/%3E%3Cellipse cx='45' cy='63' rx='7' ry='13'/%3E%3Cellipse cx='27' cy='45' rx='13' ry='7'/%3E%3Cellipse cx='63' cy='45' rx='13' ry='7'/%3E")
  if (kind === 'arches')
    return svg(70, 100, "%3Cpath d='M8 100V44c0-22 27-30 27-40 0 10 27 18 27 40v56'/%3E")
  if (kind === 'jaali')
    return svg(48, 48, "%3Ccircle cx='24' cy='24' r='14'/%3E%3Ccircle cx='0' cy='0' r='14'/%3E%3Ccircle cx='48' cy='0' r='14'/%3E%3Ccircle cx='0' cy='48' r='14'/%3E%3Ccircle cx='48' cy='48' r='14'/%3E")
  if (kind === 'paisley')
    return svg(110, 110, "%3Cpath d='M40 30c-18 12-14 44 12 44 20 0 26-26 10-36-10-7-5-20 8-23-18-5-28 5-30 15z'/%3E%3Cpath d='M92 82c-9 6-7 22 6 22 10 0 13-13 5-18-5-4-2-10 4-12-9-2-14 3-15 8z'/%3E")
  if (kind === 'glow') return `radial-gradient(ellipse at 50% 0%, ${accent}55, transparent 60%)`
  return 'none'
}

function fmtDate(e: EventItem, lang: string) {
  if (!e.date) return ''
  const d = new Date(`${e.date}T${e.time || '00:00'}`)
  if (isNaN(d.getTime())) return e.date
  const loc = 'en-GB'
  const date = d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return e.time ? `${date} · ${d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', hour12: true })}` : date
}

function icsHref(e: EventItem, title: string) {
  const start = `${e.date.replace(/-/g, '')}T${(e.time || '00:00').replace(':', '')}00`
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, ' ')
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dawatnama//EN', 'BEGIN:VEVENT', `UID:${start}-${Math.random().toString(36).slice(2)}@dawatnama`,
    `DTSTART:${start}`, 'DURATION:PT3H', `SUMMARY:${esc(`${e.name} - ${title}`)}`, `LOCATION:${esc(`${e.venue} ${e.address}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

function Countdown({ target, t }: { target: number; t: (typeof cardText)['en'] }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (now === null || target <= now) return null
  const s = Math.floor((target - now) / 1000)
  const parts: [number, string][] = [[Math.floor(s / 86400), t.days], [Math.floor(s / 3600) % 24, t.hours], [Math.floor(s / 60) % 60, t.mins], [s % 60, t.secs]]
  return (
    <section className="inv-sec">
      <h3>{t.countdown}</h3>
      <div className="count">
        {parts.map(([n, l]) => (
          <div key={l}><b>{n}</b><span>{l}</span></div>
        ))}
      </div>
    </section>
  )
}

type Reply = { attending: 'yes' | 'no' | 'maybe'; guests: number }

export function RsvpForm({ invitationId, t, events, guest, slug, demo }: {
  invitationId?: string; t: (typeof cardText)['en']; events: string[]; guest?: CardGuest | null; slug?: string; demo?: boolean
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const keys = events.length ? events : ['']
  const max = guest ? guest.party_size : 20
  const fallback: Reply = { attending: 'yes', guests: Math.min(max, guest?.party_size ?? 1) }
  const [chosen, setReplies] = useState<Record<string, Reply>>({})
  // Functions can be added or removed while editing, so every one falls back to a default reply.
  const replies = Object.fromEntries(keys.map((k) => [k, chosen[k] ?? fallback])) as Record<string, Reply>
  const canSend = Boolean(guest ? slug : invitationId) && !demo
  const set = (k: string, r: Partial<Reply>) => setReplies((x) => ({ ...x, [k]: { ...(x[k] ?? fallback), ...r } }))

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    if (!canSend) return
    const f = new FormData(ev.currentTarget)
    const rows = keys.map((k) => ({ event: k || undefined, attending: replies[k].attending, guests: replies[k].guests }))
    setState('busy')
    const res = guest && slug
      ? await submitGuestRsvp({ slug, message: String(f.get('message') || ''), rows })
      : await submitRsvp({ invitationId: invitationId!, name: String(f.get('name') || ''), message: String(f.get('message') || ''), rows })
    setState(res.ok ? 'done' : 'error')
  }
  if (state === 'done') return <p className="inv-thanks">{guest ? `Thank you, ${guest.name}! Your reply has been sent.` : t.thanks}</p>
  return (
    <form className="rsvp" onSubmit={onSubmit}>
      {!guest && <input name="name" required maxLength={80} placeholder={t.name} aria-label={t.name} />}
      {keys.map((k) => (
        <fieldset key={k || 'all'} className="rsvp-ev">
          {k && <legend>{k}</legend>}
          <div className="seg" role="radiogroup" aria-label={k || t.rsvp}>
            {(['yes', 'maybe', 'no'] as const).map((a) => (
              <button type="button" key={a} role="radio" aria-checked={replies[k].attending === a} className={replies[k].attending === a ? 'on' : ''} onClick={() => set(k, { attending: a })}>{t[a]}</button>
            ))}
          </div>
          {replies[k].attending !== 'no' && (
            <label className="row">{t.guests}
              <input type="number" min={1} max={max} value={replies[k].guests} onChange={(e) => set(k, { guests: Math.min(max, Math.max(1, Number(e.target.value) || 1)) })} />
            </label>
          )}
        </fieldset>
      ))}
      {guest && guest.party_size > 1 && <small className="rsvp-note">Your invitation is for up to {guest.party_size} people.</small>}
      <textarea name="message" maxLength={500} rows={2} placeholder={t.note} aria-label={t.note} />
      <button className="inv-btn solid" disabled={state === 'busy' || !canSend} aria-busy={state === 'busy'}>{t.send}</button>
      {!canSend && <small>{t.demo}</small>}
      {state === 'error' && <small role="alert">{t.error}</small>}
    </form>
  )
}

/** Counts a visit to a live link (the owner's own visits are skipped by the database). */
export function OpenTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `opened:${slug}`
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1') } catch { /* private mode */ }
    void createClient().rpc('record_open', { p_slug: slug })
  }, [slug])
  return null
}

function Gallery({ urls }: { urls: string[] }) {
  const [big, setBig] = useState<string | null>(null)
  return (
    <section className="inv-sec">
      <div className={`gallery n${Math.min(urls.length, 4)}`}>
        {urls.map((u, i) => <button type="button" key={i} onClick={() => setBig(u)} aria-label={`Open photo ${i + 1}`}><img src={u} alt="" loading="lazy" /></button>)}
      </div>
      {big && <div className="lightbox" role="dialog" aria-label="Photo" onClick={() => setBig(null)}><img src={big} alt="" /><button type="button" aria-label="Close">×</button></div>}
    </section>
  )
}

function Video({ url }: { url: string }) {
  const embed = videoEmbed(url)
  if (!embed) return null
  return (
    <section className="inv-sec">
      <div className="video">
        {embed.kind === 'file'
          ? <video src={embed.src} controls playsInline preload="metadata" />
          : <iframe src={embed.src} title="Video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
      </div>
    </section>
  )
}

type ViewProps = {
  content: Content; design: Design; invitationId?: string; skipOpening?: boolean
  /** Personal guest link: greets the guest by name and shows only their functions. */
  guest?: CardGuest | null
  /** Public link name, used to count opens. Omit in previews. */
  trackSlug?: string
  /** Editor preview: RSVP is shown but not sent. */
  preview?: boolean
}

export default function InvitationView({ content, design, invitationId, skipOpening, guest, trackSlug, preview }: ViewProps) {
  const t = cardText.en
  const hasOpening = !skipOpening && design.opening !== 'none'
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>(hasOpening ? 'closed' : 'open')
  const audio = useRef<HTMLAudioElement>(null)

  useEffect(() => { setStage(hasOpening ? 'closed' : 'open') }, [hasOpening, design.opening])

  const open = () => {
    setStage('opening')
    audio.current?.play().catch(() => {})
    setTimeout(() => setStage('open'), design.opening === 'storybook' || design.opening === 'gates' ? 1900 : 1500)
  }

  const nameFont = FONTS[design.nameFont] ?? FONTS[design.headingFont] ?? FONTS.pinyon
  const style = {
    '--bg': design.bg, '--ink': design.ink, '--accent': design.accent,
    '--hfont': (FONTS[design.headingFont] ?? FONTS.playfair).css,
    '--bfont': (FONTS[design.bodyFont] ?? FONTS.poppins).css,
    '--nfont': nameFont.css,
    '--art': artwork(design.background, design.accent),
  } as CSSProperties

  const events = guest?.events?.length ? content.events.filter((e) => guest.events.includes(e.name)) : content.events
  const first = events[0]
  const target = useMemo(() => (first?.date ? new Date(`${first.date}T${first.time || '00:00'}`).getTime() : 0), [first?.date, first?.time])
  const title = [content.name1, content.name2].filter(Boolean).join(` ${t.and} `)
  const hasScene = Boolean(design.scene && design.scene !== 'none')
  const showPhoto = content.photoUrl && design.photoShape !== 'none'

  return (
    <div className={`inv layout-${design.layout} card-${design.cardStyle} photo-${design.photoShape || 'circle'}${hasScene ? ` has-scene scene-on-${design.scene}` : ''}${design.foil ? ' foil' : ''}${stage === 'open' ? ' revealed' : ''}`}
      style={style} lang="en">
      {trackSlug && !preview && <OpenTracker slug={trackSlug} />}
      <Scene kind={design.scene} />
      <Effects kind={design.effect} color={design.accent} />
      {content.musicUrl && <audio ref={audio} src={content.musicUrl} loop preload="none" />}

      {stage !== 'open' && (
        <div className={`opening op-${design.opening} ${stage === 'opening' ? 'go' : ''}`}>
          <div className="op-a"><i className="op-orn" /></div><div className="op-b"><i className="op-orn" /></div>
          {design.opening === 'magic' && <div className="op-burst">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--a': `${i * (360 / 14)}deg` } as CSSProperties} />)}</div>}
          <button className="op-seal" onClick={open}>
            {guest && <span className="op-dear">Dear {guest.name}</span>}
            <span className="op-names">{title || content.eventType}</span>
            <span className="op-tap">{t.open}</span>
          </button>
        </div>
      )}

      <main className="inv-card">
        {guest && <p className="inv-dear">Dear <b>{guest.name}</b>{guest.party_size > 1 ? ' & family' : ''},</p>}
        {content.showBismillah && <p className="inv-bism">{t.bismillah}</p>}
        <p className="inv-kicker">{content.eventType}</p>
        {content.heading && <p className="inv-heading">{content.heading}</p>}
        {showPhoto && <img className="inv-photo" src={content.photoUrl} alt="" />}
        {title && (
          <h1 className="inv-names">
            <span className="nm">{content.name1}</span>
            {content.name1 && content.name2 && <span className="amp">{t.and}</span>}
            <span className="nm">{content.name2}</span>
          </h1>
        )}
        {content.hosts && <p className="inv-hosts">{content.hosts}<br /><em>{t.invite}</em></p>}
        {content.message && <p className="inv-msg">{content.message}</p>}

        {events.length > 0 && (
          <section className="inv-sec">
            <h3>{t.schedule}</h3>
            <ol className="events">
              {events.map((e, i) => (
                <li key={i}>
                  <h4>{e.name}</h4>
                  <p>{fmtDate(e, content.lang)}</p>
                  <p><strong>{e.venue}</strong>{e.address && <><br />{e.address}</>}</p>
                  <div className="ev-actions">
                    {(e.venue || e.address) && (
                      <a className="inv-btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue} ${e.address}`)}`}>{t.directions}</a>
                    )}
                    {e.date && <a className="inv-btn" href={icsHref(e, title)} download={`${e.name || 'event'}.ics`}>{t.calendar}</a>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {content.showCountdown && target > 0 && <Countdown target={target} t={t} />}
        {content.gallery?.length > 0 && <Gallery urls={content.gallery} />}
        {content.videoUrl && <Video url={content.videoUrl} />}

        {content.showFamily && content.family.filter(Boolean).length > 0 && (
          <section className="inv-sec">
            <h3>{t.family}</h3>
            <ul className="family">{content.family.filter(Boolean).map((f, i) => <li key={i}>{f}</li>)}</ul>
          </section>
        )}

        {content.showRsvp && (
          <section className="inv-sec">
            <h3>{t.rsvp}</h3>
            <RsvpForm invitationId={invitationId} t={t} events={events.map((e) => e.name).filter(Boolean)} guest={guest} slug={trackSlug} demo={preview} />
          </section>
        )}
        <a className="inv-made" href="/?ref=card" target="_blank" rel="noopener">{t.made}</a>
      </main>
    </div>
  )
}
