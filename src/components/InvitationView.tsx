'use client'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import Effects from './Effects'
import { cardText } from '@/lib/i18n'
import { FONTS, type Content, type Design, type EventItem } from '@/lib/types'
import { submitRsvp } from '@/app/actions'

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

function RsvpForm({ invitationId, t }: { invitationId?: string; t: (typeof cardText)['en'] }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [attending, setAttending] = useState('yes')
  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    if (!invitationId) return
    const f = new FormData(ev.currentTarget)
    setState('busy')
    const res = await submitRsvp({
      invitationId, name: String(f.get('name') || ''), attending,
      guests: Number(f.get('guests') || 1), message: String(f.get('message') || ''),
    })
    setState(res.ok ? 'done' : 'error')
  }
  if (state === 'done') return <p className="inv-thanks">{t.thanks}</p>
  return (
    <form className="rsvp" onSubmit={onSubmit}>
      <input name="name" required maxLength={80} placeholder={t.name} aria-label={t.name} />
      <div className="seg" role="radiogroup">
        {(['yes', 'maybe', 'no'] as const).map((k) => (
          <button type="button" key={k} role="radio" aria-checked={attending === k} className={attending === k ? 'on' : ''} onClick={() => setAttending(k)}>{t[k]}</button>
        ))}
      </div>
      {attending !== 'no' && (
        <label className="row">{t.guests}<input name="guests" type="number" min={1} max={20} defaultValue={1} /></label>
      )}
      <textarea name="message" maxLength={500} rows={2} placeholder={t.note} aria-label={t.note} />
      <button className="inv-btn solid" disabled={state === 'busy' || !invitationId}>{t.send}</button>
      {!invitationId && <small>{t.demo}</small>}
      {state === 'error' && <small role="alert">{t.error}</small>}
    </form>
  )
}

export default function InvitationView({ content, design, invitationId, skipOpening }: { content: Content; design: Design; invitationId?: string; skipOpening?: boolean }) {
  const t = cardText.en
  const hasOpening = !skipOpening && design.opening !== 'none'
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>(hasOpening ? 'closed' : 'open')
  const audio = useRef<HTMLAudioElement>(null)

  useEffect(() => { setStage(hasOpening ? 'closed' : 'open') }, [hasOpening, design.opening])

  const open = () => {
    setStage('opening')
    audio.current?.play().catch(() => {})
    setTimeout(() => setStage('open'), 1500)
  }

  const style = {
    '--bg': design.bg, '--ink': design.ink, '--accent': design.accent,
    '--hfont': (FONTS[design.headingFont] ?? FONTS.playfair).css,
    '--bfont': (FONTS[design.bodyFont] ?? FONTS.poppins).css,
    '--art': artwork(design.background, design.accent),
  } as CSSProperties

  const first = content.events[0]
  const target = useMemo(() => (first?.date ? new Date(`${first.date}T${first.time || '00:00'}`).getTime() : 0), [first?.date, first?.time])
  const title = [content.name1, content.name2].filter(Boolean).join(` ${t.and} `)

  return (
    <div className={`inv layout-${design.layout} card-${design.cardStyle}`} style={style} lang="en">
      <Effects kind={design.effect} color={design.accent} />
      {content.musicUrl && <audio ref={audio} src={content.musicUrl} loop preload="none" />}

      {stage !== 'open' && (
        <div className={`opening op-${design.opening} ${stage === 'opening' ? 'go' : ''}`}>
          <div className="op-a" /><div className="op-b" />
          <button className="op-seal" onClick={open}>
            <span className="op-names">{title || content.eventType}</span>
            <span className="op-tap">{t.open}</span>
          </button>
        </div>
      )}

      <main className="inv-card">
        {content.showBismillah && <p className="inv-bism">{t.bismillah}</p>}
        <p className="inv-kicker">{content.eventType}</p>
        {content.heading && <p className="inv-heading">{content.heading}</p>}
        {content.photoUrl && <img className="inv-photo" src={content.photoUrl} alt="" />}
        {title && (
          <h1 className="inv-names">
            {content.name1}
            {content.name1 && content.name2 && <span className="amp">{t.and}</span>}
            {content.name2}
          </h1>
        )}
        {content.hosts && <p className="inv-hosts">{content.hosts}<br /><em>{t.invite}</em></p>}
        {content.message && <p className="inv-msg">{content.message}</p>}

        {content.events.length > 0 && (
          <section className="inv-sec">
            <h3>{t.schedule}</h3>
            <ol className="events">
              {content.events.map((e, i) => (
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

        {content.showFamily && content.family.filter(Boolean).length > 0 && (
          <section className="inv-sec">
            <h3>{t.family}</h3>
            <ul className="family">{content.family.filter(Boolean).map((f, i) => <li key={i}>{f}</li>)}</ul>
          </section>
        )}

        {content.showRsvp && (
          <section className="inv-sec">
            <h3>{t.rsvp}</h3>
            <RsvpForm invitationId={invitationId} t={t} />
          </section>
        )}
        <p className="inv-made">{t.made}</p>
      </main>
    </div>
  )
}
