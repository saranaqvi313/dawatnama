'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import InvitationView from './InvitationView'
import { saveInvitation } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES, FONTS, OPTIONS, PALETTES, type Content, type Design, type EventItem, type Invitation } from '@/lib/types'

const TABS = ['Details', 'Events', 'Design', 'Share'] as const

export default function Editor({ invitation, siteUrl }: { invitation: Invitation; siteUrl: string }) {
  const [content, setContent] = useState<Content>(invitation.content)
  const [design, setDesign] = useState<Design>(invitation.design)
  const [published, setPublished] = useState(invitation.published)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Details')
  const [status, setStatus] = useState('')
  const [replay, setReplay] = useState(0)
  const [pending, start] = useTransition()

  const c = <K extends keyof Content>(k: K, v: Content[K]) => setContent((p) => ({ ...p, [k]: v }))
  const d = <K extends keyof Design>(k: K, v: Design[K]) => setDesign((p) => ({ ...p, [k]: v }))
  const link = `${siteUrl}/i/${invitation.slug}`

  const save = (pub = published) =>
    start(async () => {
      setStatus('Saving…')
      const res = await saveInvitation(invitation.id, { content, design, published: pub })
      if (res.ok) { setPublished(pub); setStatus(pub ? 'Saved. Your link is live.' : 'Saved as draft.') }
      else setStatus(`Could not save: ${res.error ?? 'unknown error'}`)
    })

  const setEvent = (i: number, k: keyof EventItem, v: string) =>
    c('events', content.events.map((e, j) => (j === i ? { ...e, [k]: v } : e)))

  async function upload(file: File | undefined) {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) return setStatus('Photo must be under 4 MB.')
    setStatus('Uploading photo…')
    const supabase = createClient()
    const path = `${invitation.user_id}/${invitation.id}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
    const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
    if (error) return setStatus(`Upload failed: ${error.message}`)
    c('photoUrl', supabase.storage.from('photos').getPublicUrl(path).data.publicUrl)
    setStatus('Photo added. Remember to save.')
  }

  const text = (label: string, k: 'heading' | 'name1' | 'name2' | 'hosts' | 'musicUrl', ph = '') => (
    <label>{label}<input value={content[k]} placeholder={ph} onChange={(e) => c(k, e.target.value)} dir="auto" /></label>
  )
  const toggle = (label: string, k: 'showBismillah' | 'showCountdown' | 'showFamily' | 'showRsvp') => (
    <label className="check"><input type="checkbox" checked={content[k]} onChange={(e) => c(k, e.target.checked)} />{label}</label>
  )
  const choice = (label: string, k: 'opening' | 'background' | 'effect' | 'layout' | 'cardStyle') => (
    <fieldset>
      <legend>{label}</legend>
      <div className="chips">
        {OPTIONS[k].map(([v, l]) => (
          <button type="button" key={v} className={design[k] === v ? 'on' : ''} onClick={() => { d(k, v); if (k === 'opening') setReplay((n) => n + 1) }}>{l}</button>
        ))}
      </div>
    </fieldset>
  )

  return (
    <div className="editor">
      <aside className="ed-panel">
        <div className="ed-top">
          <Link href="/dashboard">← My invitations</Link>
          <span className={`pill ${published ? 'live' : ''}`}>{published ? 'Live' : 'Draft'}</span>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((x) => <button key={x} role="tab" aria-selected={tab === x} className={tab === x ? 'on' : ''} onClick={() => setTab(x)}>{x}</button>)}
        </div>

        <div className="ed-body">
          {tab === 'Details' && (
            <>
              <div className="two">
                <label>Occasion
                  <input list="types" value={content.eventType} onChange={(e) => c('eventType', e.target.value)} dir="auto" />
                  <datalist id="types">{EVENT_TYPES.map((x) => <option key={x} value={x} />)}</datalist>
                </label>
              </div>
              {text('Opening line', 'heading', 'Together with their families')}
              <div className="two">{text('Name 1', 'name1', 'e.g. bride or host')}{text('Name 2 (optional)', 'name2', 'e.g. groom')}</div>
              {text('Hosted by', 'hosts', 'e.g. the family name')}
              <label>Message<textarea rows={3} value={content.message} onChange={(e) => c('message', e.target.value)} dir="auto" /></label>
              <label>Image (photo of the couple, host or venue)
                <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
              </label>
              {content.photoUrl && <button type="button" className="link" onClick={() => c('photoUrl', '')}>Remove image</button>}
              {text('Background music (link to an .mp3)', 'musicUrl', 'https://…')}
              <label>Family list (one per line)
                <textarea rows={4} value={content.family.join('\n')} onChange={(e) => c('family', e.target.value.split('\n'))} dir="auto" />
              </label>
              <fieldset><legend>Sections</legend>
                {toggle('Bismillah', 'showBismillah')}{toggle('Countdown', 'showCountdown')}{toggle('Family list', 'showFamily')}{toggle('RSVP form', 'showRsvp')}
              </fieldset>
            </>
          )}

          {tab === 'Events' && (
            <>
              {content.events.map((e, i) => (
                <fieldset key={i} className="event-ed">
                  <legend>Event {i + 1}</legend>
                  <label>Name<input value={e.name} onChange={(x) => setEvent(i, 'name', x.target.value)} dir="auto" /></label>
                  <div className="two">
                    <label>Date<input type="date" value={e.date} onChange={(x) => setEvent(i, 'date', x.target.value)} /></label>
                    <label>Time<input type="time" value={e.time} onChange={(x) => setEvent(i, 'time', x.target.value)} /></label>
                  </div>
                  <label>Venue<input value={e.venue} onChange={(x) => setEvent(i, 'venue', x.target.value)} dir="auto" /></label>
                  <label>Address<input value={e.address} onChange={(x) => setEvent(i, 'address', x.target.value)} dir="auto" /></label>
                  <button type="button" className="link" onClick={() => c('events', content.events.filter((_, j) => j !== i))}>Remove event</button>
                </fieldset>
              ))}
              <button type="button" className="btn ghost" onClick={() => c('events', [...content.events, { name: '', date: '', time: '', venue: '', address: '' }])}>+ Add event</button>
            </>
          )}

          {tab === 'Design' && (
            <>
              <fieldset><legend>Colour palette</legend>
                <div className="swatches">
                  {PALETTES.map((p) => (
                    <button type="button" key={p.name} title={p.name} aria-label={p.name} style={{ background: p.bg, borderColor: p.accent }}
                      onClick={() => setDesign((x) => ({ ...x, bg: p.bg, ink: p.ink, accent: p.accent }))}>
                      <i style={{ background: p.accent }} />
                    </button>
                  ))}
                </div>
                <div className="three">
                  <label>Card colour<input type="color" value={design.bg} onChange={(e) => d('bg', e.target.value)} /></label>
                  <label>Font colour<input type="color" value={design.ink} onChange={(e) => d('ink', e.target.value)} /></label>
                  <label>Accent<input type="color" value={design.accent} onChange={(e) => d('accent', e.target.value)} /></label>
                </div>
              </fieldset>
              <div className="two">
                <label>Heading font
                  <select value={design.headingFont} onChange={(e) => d('headingFont', e.target.value)}>
                    {Object.entries(FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                  </select>
                </label>
                <label>Body font
                  <select value={design.bodyFont} onChange={(e) => d('bodyFont', e.target.value)}>
                    {Object.entries(FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                  </select>
                </label>
              </div>
              {choice('Opening animation', 'opening')}
              {choice('Background artwork', 'background')}
              {choice('3D effect', 'effect')}
              {choice('Layout', 'layout')}
              {choice('Card style', 'cardStyle')}
              <button type="button" className="link" onClick={() => setReplay((n) => n + 1)}>Replay opening in preview</button>
            </>
          )}

          {tab === 'Share' && (
            <>
              {published ? (
                <>
                  <label>Your invitation link<input readOnly value={link} onFocus={(e) => e.target.select()} /></label>
                  <div className="chips">
                    <button type="button" onClick={() => navigator.clipboard.writeText(link).then(() => setStatus('Link copied.'))}>Copy link</button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`${content.heading} ${link}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
                    <a href={link} target="_blank" rel="noreferrer">Open card</a>
                    <Link href={`/dashboard/${invitation.id}/rsvps`}>View RSVPs</Link>
                  </div>
                  <button type="button" className="link" onClick={() => save(false)}>Unpublish (take the link offline)</button>
                </>
              ) : (
                <p className="muted">Publish to get a link you can share. You can keep editing afterwards; the same link always shows the latest version.</p>
              )}
            </>
          )}
        </div>

        <div className="ed-foot">
          <small aria-live="polite">{status}</small>
          <div>
            <button className="btn ghost" disabled={pending} onClick={() => save()}>Save</button>
            {!published && <button className="btn" disabled={pending} onClick={() => { save(true); setTab('Share') }}>Publish</button>}
          </div>
        </div>
      </aside>

      <section className="ed-preview">
        <div className="phone"><div className="phone-scroll">
          <InvitationView key={replay} content={content} design={design} />
        </div></div>
      </section>
    </div>
  )
}
