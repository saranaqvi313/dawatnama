'use client'
import { useState, useTransition, type CSSProperties } from 'react'
import Link from 'next/link'
import InvitationView from './InvitationView'
import Scene from './Scene'
import LinkNameField from './LinkNameField'
import QrButton from './QrButton'
import { saveInvitation } from '@/app/actions'
import { activateCardLink } from '@/app/guestActions'
import { PAY_MESSAGES } from './SharePaywall'
import { PRODUCTS, rupees } from '@/lib/pricing'
import { uploadMedia } from '@/lib/upload'
import { videoEmbed } from '@/lib/media'
import { EVENT_TYPES, FONTS, OPTIONS, PALETTES, SCRIPT_FONTS, TEXT_FONTS, type Content, type Design, type EventItem, type Invitation } from '@/lib/types'

const TABS = ['Details', 'Events', 'Photos & video', 'Design', 'Share'] as const
type Tab = (typeof TABS)[number]
const QUICK_EVENTS = ['Dholki', 'Mayun', 'Mehndi', 'Nikah', 'Baraat', 'Rukhsati', 'Walima', 'Mangni', 'Qawwali Night', 'Aqeeqa']

type Props = { invitation: Invitation; siteUrl: string; premium: boolean; sharePaid: boolean; credits: number; payResult?: string }

export default function Editor({ invitation, siteUrl, premium, sharePaid: paid0, credits: credits0, payResult }: Props) {
  const [content, setContent] = useState<Content>(invitation.content)
  const [design, setDesign] = useState<Design>(invitation.design)
  const [published, setPublished] = useState(invitation.published)
  const [sharePaid, setSharePaid] = useState(paid0)
  const [credits, setCredits] = useState(credits0)
  const [tab, setTab] = useState<Tab>(payResult ? 'Share' : 'Details')
  const [status, setStatus] = useState(payResult ? PAY_MESSAGES[payResult] ?? '' : '')
  const [saving, setSaving] = useState<'save' | 'publish' | 'unlock' | ''>('')
  const [uploading, setUploading] = useState('')
  const [replay, setReplay] = useState(0)
  const [showOpening, setShowOpening] = useState(false)
  const [pending, start] = useTransition()
  const [slug, setSlug] = useState(invitation.slug)
  const link = `${siteUrl}/${slug}`
  const guestsHref = `/dashboard/${invitation.id}/guests`

  const c = <K extends keyof Content>(k: K, v: Content[K]) => setContent((p) => ({ ...p, [k]: v }))
  const d = <K extends keyof Design>(k: K, v: Design[K]) => setDesign((p) => ({ ...p, [k]: v }))

  const persist = async (pub: boolean) => {
    const res = await saveInvitation(invitation.id, { content, design, published: pub })
    if (res.ok) { setPublished(res.published); setStatus(res.published ? 'Saved. Your link shows the latest version.' : 'Saved.') }
    else setStatus(`Could not save: ${res.error ?? 'unknown error'}`)
    return res.ok
  }
  const save = (pub = published) => {
    setSaving(pub && !published ? 'publish' : 'save'); setStatus('Saving…')
    start(async () => { await persist(pub); setSaving('') })
  }
  async function unlock() {
    setSaving('unlock'); setStatus('')
    if (!(await persist(false))) { setSaving(''); return }
    const res = await activateCardLink(invitation.id)
    setSaving('')
    if (!res.ok) return setStatus(res.error ?? 'Could not unlock the link.')
    setSharePaid(true); setPublished(true); setCredits((n) => Math.max(0, n - 1))
    setStatus('Your card link is live.')
  }

  const setEvent = (i: number, k: keyof EventItem, v: string) => c('events', content.events.map((e, j) => (j === i ? { ...e, [k]: v } : e)))
  const moveEvent = (i: number, by: number) => {
    const list = content.events.slice(); const j = i + by
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]; c('events', list)
  }
  const addEvent = (name = '') => c('events', [...content.events, { name, date: content.events.at(-1)?.date ?? '', time: '', venue: '', address: '' }])

  async function upload(file: File | undefined, kind: 'photo' | 'gallery' | 'video') {
    if (!file) return
    setUploading(kind); setStatus(kind === 'video' ? 'Uploading video…' : 'Shrinking and uploading photo…')
    try {
      const url = await uploadMedia(file, invitation.user_id, invitation.id, kind === 'video' ? 'video' : 'image')
      if (kind === 'photo') c('photoUrl', url)
      else if (kind === 'gallery') setContent((p) => ({ ...p, gallery: [...(p.gallery ?? []), url].slice(0, 8) }))
      else c('videoUrl', url)
      setStatus('Added. Remember to save.')
    } catch (e) { setStatus((e as Error).message) }
    setUploading('')
  }
  async function uploadMany(files: FileList | null) {
    const list = Array.from(files ?? []).slice(0, Math.max(0, 8 - (content.gallery?.length ?? 0)))
    for (const f of list) await upload(f, 'gallery')
  }

  const text = (label: string, k: 'heading' | 'name1' | 'name2' | 'hosts' | 'musicUrl', ph = '') => (
    <label>{label}<input value={content[k]} placeholder={ph} onChange={(e) => c(k, e.target.value)} dir="auto" /></label>
  )
  const toggle = (label: string, k: 'showBismillah' | 'showCountdown' | 'showFamily' | 'showRsvp') => (
    <label className="check"><input type="checkbox" checked={content[k]} onChange={(e) => c(k, e.target.checked)} />{label}</label>
  )
  const choice = (label: string, k: 'opening' | 'background' | 'effect' | 'layout' | 'cardStyle' | 'photoShape', after?: () => void) => (
    <fieldset>
      <legend>{label}</legend>
      <div className="chips">
        {OPTIONS[k].map(([v, l]) => (
          <button type="button" key={v} className={design[k] === v ? 'on' : ''} onClick={() => { d(k, v); after?.() }}>{l}</button>
        ))}
      </div>
    </fieldset>
  )
  const names = [content.name1, content.name2].filter(Boolean).join(' & ') || 'Ayesha & Hamza'
  const swatch = { '--bg': design.bg, '--ink': design.ink, '--accent': design.accent } as CSSProperties
  const playOpening = () => { setShowOpening(true); setReplay((n) => n + 1) }

  return (
    <div className="editor">
      <aside className="ed-panel">
        <div className="ed-top">
          <Link href="/dashboard">← My invitations</Link>
          <span className={`pill ${published ? 'live' : ''}`}>{published ? 'Live' : 'Draft'}</span>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((x) => <button key={x} role="tab" aria-selected={tab === x} className={tab === x ? 'on' : ''} onClick={() => setTab(x)}>{x === 'Photos & video' ? 'Media' : x}</button>)}
        </div>

        <div className="ed-body">
          {tab === 'Details' && (
            <>
              <label>Occasion
                <input list="types" value={content.eventType} onChange={(e) => c('eventType', e.target.value)} dir="auto" />
                <datalist id="types">{EVENT_TYPES.map((x) => <option key={x} value={x} />)}</datalist>
              </label>
              {text('Opening line', 'heading', 'Together with their families')}
              <div className="two">{text('Name 1', 'name1', 'e.g. bride or host')}{text('Name 2 (optional)', 'name2', 'e.g. groom')}</div>
              {text('Hosted by', 'hosts', 'e.g. the family name')}
              <label>Message<textarea rows={3} value={content.message} onChange={(e) => c('message', e.target.value)} dir="auto" /></label>
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
              <fieldset>
                <legend>Add a function</legend>
                <div className="chips">
                  {QUICK_EVENTS.map((n) => <button type="button" key={n} onClick={() => addEvent(n)}>+ {n}</button>)}
                  <button type="button" onClick={() => addEvent('')}>+ Other</button>
                </div>
              </fieldset>
              {content.events.length === 0 && <p className="muted">No functions yet. Add Mehndi, Nikah, Baraat or any other above.</p>}
              {content.events.map((e, i) => (
                <fieldset key={i} className="event-ed">
                  <legend>{e.name || `Function ${i + 1}`}</legend>
                  <label>Name
                    <input list="ev-types" value={e.name} onChange={(x) => setEvent(i, 'name', x.target.value)} dir="auto" placeholder="e.g. Mehndi" />
                  </label>
                  <div className="two">
                    <label>Date<input type="date" value={e.date} onChange={(x) => setEvent(i, 'date', x.target.value)} /></label>
                    <label>Time<input type="time" value={e.time} onChange={(x) => setEvent(i, 'time', x.target.value)} /></label>
                  </div>
                  <label>Venue<input value={e.venue} onChange={(x) => setEvent(i, 'venue', x.target.value)} dir="auto" /></label>
                  <label>Address<input value={e.address} onChange={(x) => setEvent(i, 'address', x.target.value)} dir="auto" /></label>
                  <div className="row-actions">
                    <button type="button" className="link" disabled={i === 0} onClick={() => moveEvent(i, -1)}>Move up</button>
                    <button type="button" className="link" disabled={i === content.events.length - 1} onClick={() => moveEvent(i, 1)}>Move down</button>
                    <button type="button" className="link danger" onClick={() => c('events', content.events.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                </fieldset>
              ))}
              <datalist id="ev-types">{EVENT_TYPES.map((x) => <option key={x} value={x} />)}</datalist>
            </>
          )}

          {tab === 'Photos & video' && (
            <>
              <fieldset>
                <legend>Main photo</legend>
                {content.photoUrl && <img className="ed-thumb" src={content.photoUrl} alt="" />}
                <label className="file-btn">{content.photoUrl ? 'Change photo' : 'Add a photo'}
                  <input type="file" accept="image/*" disabled={!!uploading} onChange={(e) => upload(e.target.files?.[0], 'photo')} />
                </label>
                {content.photoUrl && <button type="button" className="link" onClick={() => c('photoUrl', '')}>Remove photo</button>}
              </fieldset>
              <fieldset>
                <legend>Photo gallery ({content.gallery?.length ?? 0}/8)</legend>
                <div className="ed-gallery">
                  {(content.gallery ?? []).map((u, i) => (
                    <div key={u}><img src={u} alt="" /><button type="button" aria-label="Remove photo" onClick={() => c('gallery', content.gallery.filter((_, j) => j !== i))}>×</button></div>
                  ))}
                </div>
                {(content.gallery?.length ?? 0) < 8 && (
                  <label className="file-btn">Add photos
                    <input type="file" accept="image/*" multiple disabled={!!uploading} onChange={(e) => uploadMany(e.target.files)} />
                  </label>
                )}
                <p className="muted small-note">Photos are made smaller automatically so the card opens fast on phones.</p>
              </fieldset>
              <fieldset>
                <legend>Video</legend>
                <label>YouTube or Vimeo link<input value={content.videoUrl} placeholder="https://youtu.be/…" dir="ltr" onChange={(e) => c('videoUrl', e.target.value.trim())} /></label>
                {content.videoUrl && !videoEmbed(content.videoUrl) && <p className="err">This link can&apos;t be played. Use a YouTube or Vimeo link, or upload an MP4.</p>}
                <label className="file-btn">Or upload a video (MP4, up to 30 MB)
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={!!uploading} onChange={(e) => upload(e.target.files?.[0], 'video')} />
                </label>
                {content.videoUrl && <button type="button" className="link" onClick={() => c('videoUrl', '')}>Remove video</button>}
              </fieldset>
              {text('Background music (link to an .mp3)', 'musicUrl', 'https://…')}
              {uploading && <p className="muted" aria-live="polite"><span className="spin-inline" /> Uploading…</p>}
            </>
          )}

          {tab === 'Design' && !premium && (
            <div className="locked">
              <p className="kicker">Premium</p>
              <h3>Make it a fairy tale</h3>
              <p className="muted">Animated scenes (Sheesh Mahal, Chandni Raat, Gulistan, sky lanterns, marigolds, fairy castle), calligraphy names with gold foil, storybook and palace-gate openings, colours, fonts and the drag-and-drop designer. One payment for all your cards.</p>
              <Link href="/premium" className="btn">Unlock Premium</Link>
              <p className="muted small-note">Free cards can still use any template as it is. <Link href="/templates">See templates</Link></p>
            </div>
          )}

          {tab === 'Design' && premium && (
            <div className="design-tab" style={swatch}>
              <fieldset>
                <legend>Scene</legend>
                <div className="scene-tiles">
                  {OPTIONS.scene.map(([v, l]) => (
                    <button type="button" key={v} className={`scene-tile${design.scene === v ? ' on' : ''}`} onClick={() => d('scene', v)} aria-pressed={design.scene === v}>
                      <span className="scene-mini" style={{ background: design.bg }}>{v !== 'none' ? <Scene kind={v} /> : <i>—</i>}</span>
                      <span>{l}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset><legend>Colours</legend>
                <div className="swatches">
                  {PALETTES.map((p) => (
                    <button type="button" key={p.name} title={p.name} aria-label={p.name} style={{ background: p.bg, borderColor: p.accent }}
                      className={design.bg === p.bg && design.accent === p.accent ? 'on' : ''}
                      onClick={() => setDesign((x) => ({ ...x, bg: p.bg, ink: p.ink, accent: p.accent }))}>
                      <i style={{ background: p.accent }} />
                    </button>
                  ))}
                </div>
                <div className="three">
                  <label>Card<input type="color" value={design.bg} onChange={(e) => d('bg', e.target.value)} /></label>
                  <label>Text<input type="color" value={design.ink} onChange={(e) => d('ink', e.target.value)} /></label>
                  <label>Gold / accent<input type="color" value={design.accent} onChange={(e) => d('accent', e.target.value)} /></label>
                </div>
              </fieldset>
              <fieldset>
                <legend>Names lettering</legend>
                <div className="font-tiles">
                  {SCRIPT_FONTS.map((k) => (
                    <button type="button" key={k} className={design.nameFont === k ? 'on' : ''} onClick={() => d('nameFont', k)} title={FONTS[k].label}>
                      <span style={{ fontFamily: FONTS[k].css }}>{names}</span>
                      <small>{FONTS[k].label}</small>
                    </button>
                  ))}
                </div>
                <label className="check"><input type="checkbox" checked={design.foil} onChange={(e) => d('foil', e.target.checked)} />Gold foil shimmer on names</label>
              </fieldset>
              <div className="two">
                <label>Headings font
                  <select value={design.headingFont} onChange={(e) => d('headingFont', e.target.value)}>
                    {TEXT_FONTS.map((k) => <option key={k} value={k}>{FONTS[k].label}</option>)}
                  </select>
                </label>
                <label>Text font
                  <select value={design.bodyFont} onChange={(e) => d('bodyFont', e.target.value)}>
                    {TEXT_FONTS.map((k) => <option key={k} value={k}>{FONTS[k].label}</option>)}
                  </select>
                </label>
              </div>
              {choice('Opening', 'opening', playOpening)}
              <button type="button" className="btn ghost small" onClick={playOpening}>Watch the opening</button>
              {choice('Floating effect', 'effect')}
              {choice('Card style', 'cardStyle')}
              {choice('Photo shape', 'photoShape')}
              {choice('Background pattern', 'background')}
              {choice('Layout', 'layout')}
            </div>
          )}

          {tab === 'Share' && (
            <>
              <LinkNameField invitationId={invitation.id} slug={slug} siteUrl={siteUrl} live={published} paid={sharePaid} onSaved={setSlug} />
              <div className="share-box">
                <h3>Personal guest links</h3>
                <p className="muted">Each guest gets their own link, like <span dir="ltr">{siteUrl.replace(/^https?:\/\//, '')}/ali-khan</span>. The card greets them by name, and you see who opened it and who is coming. {rupees(PRODUCTS.links1.price)} per guest, less in bundles.</p>
                <Link className="btn" href={guestsHref}>Guest list and links</Link>
              </div>
              <div className="share-box">
                <h3>Open link for this card</h3>
                {published ? (
                  <>
                    <label>Your card link<input readOnly value={link} onFocus={(e) => e.target.select()} dir="ltr" /></label>
                    <div className="chips">
                      <button type="button" onClick={() => navigator.clipboard.writeText(link).then(() => setStatus('Link copied.'))}>Copy link</button>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`${content.heading} ${link}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
                      <a href={link} target="_blank" rel="noreferrer">Open card</a>
                      <QrButton link={link} label="QR code" fileName={`qr-${slug}`} />
                      <Link href={`/dashboard/${invitation.id}/rsvps`}>Replies</Link>
                    </div>
                    <button type="button" className="link" onClick={() => save(false)}>Take the link offline</button>
                  </>
                ) : sharePaid ? (
                  <>
                    <p className="muted">This card&apos;s link is unlocked. Put it online again whenever you like.</p>
                    <button type="button" className="btn" disabled={pending} aria-busy={saving === 'publish'} onClick={() => save(true)}>Put link online</button>
                  </>
                ) : (
                  <>
                    <p className="muted">One link anyone can open (for a WhatsApp group or Instagram). Uses 1 guest link. You have {credits}.</p>
                    {credits > 0
                      ? <button type="button" className="btn" disabled={!!saving} aria-busy={saving === 'unlock'} onClick={unlock}>Unlock with 1 link</button>
                      : <Link className="btn" href={`/premium?return=${encodeURIComponent(`/dashboard/${invitation.id}`)}`}>Buy links</Link>}
                    <p className="muted small-note">Your full link appears here once it is unlocked.</p>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="ed-foot">
          <small aria-live="polite">{status}</small>
          <div>
            <button className="btn ghost" disabled={pending} aria-busy={saving === 'save'} onClick={() => save()}>Save</button>
            <Link className="btn" href={guestsHref} onClick={() => { void persist(published) }}>Guests</Link>
          </div>
        </div>
      </aside>

      <section className="ed-preview">
        <div className="phone"><div className="phone-scroll">
          <InvitationView key={replay} content={content} design={design} skipOpening={!showOpening} preview />
        </div></div>
      </section>
    </div>
  )
}
