'use client'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cardText } from '@/lib/i18n'
import { videoEmbed } from '@/lib/media'
import { FONTS, STORY_THEMES, type Content, type Design, type EventItem } from '@/lib/types'
import Effects from '../Effects'
import { OpenTracker, RsvpForm, fmtDate, icsHref, type CardGuest } from '../InvitationView'
import { Florals, Pearls, ProgramIcon, TornEdge, WaxSeal } from './Art'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

type Props = {
  content: Content; design: Design; invitationId?: string; skipOpening?: boolean
  guest?: CardGuest | null; trackSlug?: string; preview?: boolean
}

const parseDay = (e?: EventItem) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e?.date || '')
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null
}
const initialsOf = (a: string, b: string) => [a, b].map((x) => x.trim()[0] ?? '').filter(Boolean).join('·').toUpperCase() || '♥'

/** Fades a section up the first time it scrolls into view. Content stays visible if scripts are off. */
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null)
  // '' until scripts run (so nothing is ever hidden without JS), then 'wait' until on screen, then 'in'.
  const [state, setState] = useState<'' | 'wait' | 'in'>('')
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setState('in'); return }
    setState('wait')
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState('in'); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <section ref={ref} className={`st-sec ${state} ${className}`} style={{ '--rd': `${delay}s` } as CSSProperties}>{children}</section>
}

function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const s = now === null ? 0 : Math.max(0, Math.floor((target - now) / 1000))
  const parts: [number, string][] = [[Math.floor(s / 86400), 'days'], [Math.floor(s / 3600) % 24, 'hours'], [Math.floor(s / 60) % 60, 'minutes'], [s % 60, 'seconds']]
  return (
    <div className="st-count">
      {parts.map(([n, l], i) => (
        <div key={l}>
          <b suppressHydrationWarning>{now === null ? '–' : String(n).padStart(2, '0')}</b><span>{l}</span>
          {i < 3 && <i aria-hidden="true">:</i>}
        </div>
      ))}
    </div>
  )
}

function Calendar({ y, m, d }: { y: number; m: number; d: number }) {
  const first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const cells = [...Array(first).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)]
  return (
    <div className="st-cal">
      <div className="st-cal-head">{MONTHS[m]} {y}</div>
      <div className="st-cal-grid">
        {WEEK.map((w) => <span key={w} className="st-cal-w">{w}</span>)}
        {cells.map((n, i) => (
          <span key={i} className={n === d ? 'on' : ''}>
            {n === d && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11Z" /></svg>}
            <em>{n || ''}</em>
          </span>
        ))}
      </div>
    </div>
  )
}

function Polaroids({ urls }: { urls: string[] }) {
  const [big, setBig] = useState<string | null>(null)
  return (
    <>
      <div className="st-polaroids">
        {urls.map((u, i) => (
          <button type="button" key={u} className="st-polaroid" style={{ '--r': `${[-4, 3, -2, 5, -3, 2, -5, 4][i % 8]}deg` } as CSSProperties} onClick={() => setBig(u)} aria-label={`Open photo ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" loading="lazy" />
            <i className="st-tape" aria-hidden="true" />
          </button>
        ))}
      </div>
      {big && (
        <div className="lightbox" role="dialog" aria-label="Photo" onClick={() => setBig(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={big} alt="" /><button type="button" aria-label="Close">×</button>
        </div>
      )}
    </>
  )
}

/**
 * Story card: a long, website-style invitation in sections (envelope with a wax seal, hero,
 * welcome, calendar, countdown, programme, venues, dress code, photos, RSVP, closing).
 */
export default function StoryView({ content, design, invitationId, skipOpening, guest, trackSlug, preview }: Props) {
  const t = cardText.en
  const theme = STORY_THEMES[design.theme] ?? STORY_THEMES.burgundy
  const hasOpening = !skipOpening && design.opening !== 'none'
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>(hasOpening ? 'closed' : 'open')
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => { setStage(hasOpening ? 'closed' : 'open') }, [hasOpening])

  const events = guest?.events?.length ? content.events.filter((e) => guest.events.includes(e.name)) : content.events
  const first = events[0]
  const day = parseDay(first)
  const target = useMemo(() => (first?.date ? new Date(`${first.date}T${first.time || '00:00'}`).getTime() : 0), [first?.date, first?.time])
  const names = [content.name1, content.name2].filter(Boolean)
  const title = names.join(' & ') || content.eventType
  const initials = initialsOf(content.name1, content.name2)
  const program = content.program?.length ? content.program : events.filter((e) => e.time).map((e) => ({ time: e.time, title: e.name, icon: /nikah/i.test(e.name) ? 'mosque' : /walima|dinner/i.test(e.name) ? 'dinner' : /mehndi|dholki/i.test(e.name) ? 'music' : 'heart' }))
  const dateBig = day ? `${String(day.d).padStart(2, '0')} · ${String(day.m + 1).padStart(2, '0')} · ${day.y}` : ''
  const nameFont = (FONTS[design.nameFont] ?? FONTS.pinyon).css
  const headFont = (FONTS[design.headingFont] ?? FONTS.cormorant).css
  const bodyFont = (FONTS[design.bodyFont] ?? FONTS.cormorant).css
  const video = content.videoUrl ? videoEmbed(content.videoUrl) : null

  const open = () => {
    setStage('opening')
    audio.current?.play().then(() => setPlaying(true)).catch(() => {})
    setTimeout(() => setStage('open'), 2300)
  }
  const toggleMusic = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {})
    else { a.pause(); setPlaying(false) }
  }

  const style = {
    '--st-bg': theme.bg, '--st-paper': theme.paper, '--st-ink': theme.ink, '--st-accent': theme.accent, '--st-gold': theme.gold, '--st-soft': theme.soft,
    '--st-name': nameFont, '--st-head': headFont, '--st-body': bodyFont,
    // RSVP form and lightbox reuse the card variables
    '--bg': theme.paper, '--ink': theme.ink, '--accent': theme.accent, '--bfont': bodyFont, '--hfont': headFont,
  } as CSSProperties

  return (
    <div className={`st st-${design.theme in STORY_THEMES ? design.theme : 'burgundy'} st-deco-${theme.deco} ${stage === 'open' ? 'is-open' : ''}`} style={style} lang="en">
      {trackSlug && !preview && <OpenTracker slug={trackSlug} />}
      {stage === 'open' && <Effects kind={design.effect} color={theme.gold} />}
      {content.musicUrl && <audio ref={audio} src={content.musicUrl} loop preload="none" />}
      {content.musicUrl && stage === 'open' && (
        <button type="button" className="st-music" onClick={toggleMusic} aria-label={playing ? 'Pause music' : 'Play music'}>{playing ? '❚❚' : '♪'}</button>
      )}

      {stage !== 'open' && (
        <div className={`st-envelope ${stage === 'opening' ? 'go' : ''}`}>
          <div className="st-env-inner">
            <p className="st-env-to">{guest ? <>Dear <b>{guest.name}</b></> : 'You are invited'}</p>
            <div className="st-env">
              <div className="st-env-back" />
              <div className="st-env-letter"><span>{title}</span></div>
              <div className="st-env-front" />
              <div className="st-env-flap" />
              <button type="button" className="st-env-seal" onClick={open} aria-label="Open the invitation">
                <WaxSeal initials={initials} size={92} />
              </button>
            </div>
            <p className="st-env-tap">Tap the seal to open</p>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="st-hero">
        <Florals kind={theme.deco} className="st-corner tl" />
        <Florals kind={theme.deco} flip className="st-corner tr" />
        <p className="st-kicker">{content.eventType || 'Wedding'} invitation</p>
        {content.photoUrl ? (
          <div className="st-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.photoUrl} alt="" />
          </div>
        ) : (
          <div className="st-photo st-photo-empty" aria-hidden="true"><WaxSeal initials={initials} size={120} /></div>
        )}
        <h1 className="st-names">
          {names.length ? <>
            <span>{names[0]}</span>
            {names[1] && <><em>&amp;</em><span>{names[1]}</span></>}
          </> : <span>{content.eventType}</span>}
        </h1>
        {dateBig && <p className="st-bigdate">{dateBig}</p>}
        {content.heading && <p className="st-heading">{content.heading}</p>}
        <TornEdge className="st-edge" />
      </header>

      <main className="st-body">
        {/* Welcome */}
        <Reveal className="st-paper">
          {content.showBismillah && <p className="st-bism">{t.bismillah}</p>}
          <h2 className="st-script">{guest ? `Dear ${guest.name}${guest.party_size > 1 ? ' & family' : ''}` : 'Dear family & friends'}</h2>
          {content.message && <p className="st-text">{content.message}</p>}
          {content.hosts && <p className="st-hosts">{content.hosts}</p>}
          {theme.deco === 'pearls' ? <Pearls className="st-div" /> : <div className="st-div st-div-line" aria-hidden="true"><i /></div>}
        </Reveal>

        {/* Calendar + countdown */}
        {(content.showCalendar && day) || (content.showCountdown && target > 0) ? (
          <Reveal className="st-dark">
            <h2 className="st-caps">Save the date</h2>
            {content.showCalendar && day && <Calendar {...day} />}
            {content.showCountdown && target > 0 && <><p className="st-small">Until our celebration</p><Countdown target={target} /></>}
          </Reveal>
        ) : null}

        {/* Programme */}
        {content.showProgram && program.length > 0 && (
          <Reveal className="st-paper">
            <h2 className="st-caps">Programme</h2>
            <p className="st-script st-sub">of the day</p>
            <ol className="st-timeline">
              {program.map((p, i) => (
                <li key={i} style={{ '--i': i } as CSSProperties}>
                  <span className="st-time">{p.time}</span>
                  <span className="st-dot"><ProgramIcon name={p.icon} /></span>
                  <span className="st-what">{p.title}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        )}

        {/* Venues */}
        {events.length > 0 && (
          <Reveal className="st-soft">
            <h2 className="st-caps">{events.length > 1 ? 'Where & when' : 'Location'}</h2>
            <div className="st-venues">
              {events.map((e, i) => (
                <article key={i} className="st-venue">
                  <h3 className="st-script">{e.name}</h3>
                  <p className="st-when">{fmtDate(e, 'en')}</p>
                  {e.venue && <p className="st-where"><b>{e.venue}</b>{e.address && <><br />{e.address}</>}</p>}
                  <div className="st-btns">
                    {(e.venue || e.address) && <a className="st-btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue} ${e.address}`)}`}>Show on map</a>}
                    {e.date && <a className="st-btn ghost" href={icsHref(e, title)} download={`${e.name || 'event'}.ics`}>Add to calendar</a>}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        )}

        {/* Dress code */}
        {content.showDress && (content.dressCode || content.dressColors.length > 0) && (
          <Reveal className="st-paper">
            <h2 className="st-caps">Dress code</h2>
            {content.dressCode && <p className="st-text">{content.dressCode}</p>}
            {content.dressColors.length > 0 && (
              <div className="st-swatches">{content.dressColors.map((c, i) => <i key={i} style={{ background: c, '--i': i } as CSSProperties} />)}</div>
            )}
          </Reveal>
        )}

        {/* Photos and video */}
        {(content.gallery?.length > 0 || video) && (
          <Reveal className="st-dark">
            <h2 className="st-caps">Our moments</h2>
            {content.gallery?.length > 0 && <Polaroids urls={content.gallery} />}
            {video && (
              <div className="st-video">
                {video.kind === 'file'
                  ? <video src={video.src} controls playsInline preload="metadata" />
                  : <iframe src={video.src} title="Video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
              </div>
            )}
          </Reveal>
        )}

        {/* Family */}
        {content.showFamily && content.family.filter(Boolean).length > 0 && (
          <Reveal className="st-paper">
            <h2 className="st-caps">Awaiting your arrival</h2>
            <ul className="st-family">{content.family.filter(Boolean).map((f, i) => <li key={i}>{f}</li>)}</ul>
          </Reveal>
        )}

        {/* RSVP */}
        {content.showRsvp && (
          <Reveal className="st-soft st-rsvp-sec">
            <h2 className="st-caps">Will you join us?</h2>
            <p className="st-small">Please let us know if you can come</p>
            <div className="st-form">
              <RsvpForm invitationId={invitationId} t={t} events={events.map((e) => e.name).filter(Boolean)} guest={guest} slug={trackSlug} demo={preview} />
            </div>
          </Reveal>
        )}

        {/* Closing */}
        <Reveal className="st-dark st-closing">
          <Florals kind={theme.deco} className="st-closing-art" />
          <p className="st-script st-big">{content.closing || 'We are waiting for you!'}</p>
          {names.length > 0 && <p className="st-caps st-sign">{names.join(' & ')}</p>}
          <a className="st-made" href="/?ref=card" target="_blank" rel="noopener">{t.made}</a>
        </Reveal>
      </main>
    </div>
  )
}
