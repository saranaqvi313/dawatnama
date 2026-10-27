'use client'
import { useState, useTransition, type CSSProperties } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Field from '@/components/Field'
import Icon from '@/components/Icon'
import Select from '@/components/Select'
import Tabs from '@/components/Tabs'
import InvitationView from './InvitationView'
import Scene from './Scene'
import { ProgramIcon, WaxSeal } from './story/Art'
import LinkNameField from './LinkNameField'
import QrButton from './QrButton'
import { Chips, ColorField, Label, Notice, Panel, SwitchRow, UploadBox } from './ui'
import { convertToDesigner, saveInvitation } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { activateCardLink } from '@/app/guestActions'
import { PAY_MESSAGES } from './SharePaywall'
import { FREE_MODE, PRODUCTS, rupees } from '@/lib/pricing'
import { uploadMedia } from '@/lib/upload'
import { videoEmbed } from '@/lib/media'
import { EVENT_TYPES, FONTS, OPTIONS, PALETTES, PROGRAM_ICONS, SCRIPT_FONTS, STORY_THEMES, TEXT_FONTS, type Content, type Design, type EventItem, type Invitation } from '@/lib/types'

const TABS = [
  { id: 1, name: 'Details' },
  { id: 2, name: 'Events' },
  { id: 3, name: 'Media' },
  { id: 4, name: 'Design' },
  { id: 5, name: 'Share' },
]
const QUICK_EVENTS = ['Dholki', 'Mayun', 'Mehndi', 'Nikah', 'Baraat', 'Rukhsati', 'Walima', 'Mangni', 'Qawwali Night', 'Aqeeqa']
const FORM = 'flex flex-col gap-8 px-5 pb-5 max-lg:px-3 max-lg:pb-3 max-md:gap-6'

type Props = { invitation: Invitation; siteUrl: string; premium: boolean; sharePaid: boolean; credits: number; payResult?: string }

/** The classic card editor: form cards on the left, live phone preview on the right (kit "new product" layout). */
export default function Editor({ invitation, siteUrl, premium, sharePaid: paid0, credits: credits0, payResult }: Props) {
  const [content, setContent] = useState<Content>(invitation.content)
  const [design, setDesign] = useState<Design>(invitation.design)
  const [published, setPublished] = useState(invitation.published)
  const [sharePaid, setSharePaid] = useState(paid0)
  const [credits, setCredits] = useState(credits0)
  const [tab, setTab] = useState(payResult ? TABS[4] : TABS[0])
  const [status, setStatus] = useState(payResult ? PAY_MESSAGES[payResult] ?? '' : '')
  const [saving, setSaving] = useState<'save' | 'publish' | 'unlock' | ''>('')
  const [uploading, setUploading] = useState('')
  const [replay, setReplay] = useState(0)
  const [showOpening, setShowOpening] = useState(false)
  const [pending, start] = useTransition()
  const [slug, setSlug] = useState(invitation.slug)
  const router = useRouter()
  const [converting, setConverting] = useState(false)
  async function openInDesigner() {
    setConverting(true); setStatus('Opening in the designer…')
    if (!(await persist(published))) { setConverting(false); return }
    const res = await convertToDesigner(invitation.id)
    if (!res.ok) { setConverting(false); setStatus(res.error ?? 'Could not open the designer.'); return }
    router.push(`/design/${invitation.id}`)
  }
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

  const text = (label: string, k: 'heading' | 'name1' | 'name2' | 'hosts' | 'musicUrl', ph = '', cls = '') => (
    <Field className={cls} label={label} value={content[k]} placeholder={ph} onChange={(e) => c(k, e.target.value)} dir="auto" />
  )
  const choice = (label: string, k: 'opening' | 'background' | 'effect' | 'layout' | 'cardStyle' | 'photoShape', after?: () => void) => (
    <div>
      <Label>{label}</Label>
      <Chips value={design[k] as string} options={OPTIONS[k] as unknown as [string, string][]} onChange={(v) => { d(k, v as Design[typeof k]); after?.() }} />
    </div>
  )
  const fontOptions = TEXT_FONTS.map((k, i) => ({ id: i + 1, name: FONTS[k].label }))
  const fontSelect = (label: string, k: 'headingFont' | 'bodyFont') => (
    <Select className="flex-1" label={label} options={fontOptions} value={fontOptions[TEXT_FONTS.indexOf(design[k] as (typeof TEXT_FONTS)[number])] ?? null}
      onChange={(o) => d(k, TEXT_FONTS[o.id - 1])} placeholder="Choose a font" />
  )
  const names = [content.name1, content.name2].filter(Boolean).join(' & ') || 'Ayesha & Hamza'
  const isStory = design.layout === 'story'
  const pickTheme = (k: string) => { const th = STORY_THEMES[k]; setDesign((x) => ({ ...x, theme: k, bg: th.paper, ink: th.ink, accent: th.accent })) }
  const setLayout = (v: string) => setDesign((x) => {
    if (v === 'story') { const k = x.theme in STORY_THEMES ? x.theme : 'burgundy'; const th = STORY_THEMES[k]; return { ...x, layout: v, theme: k, bg: th.paper, ink: th.ink, accent: th.accent, opening: 'seal' } }
    return { ...x, layout: v, opening: x.opening === 'seal' ? 'envelope' : x.opening }
  })
  const setProg = (i: number, k: 'time' | 'title' | 'icon', v: string) => c('program', content.program.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  const swatch = { '--bg': design.bg, '--ink': design.ink, '--accent': design.accent } as CSSProperties
  const playOpening = () => { setShowOpening(true); setReplay((n) => n + 1) }
  const tone = status.startsWith('Could not') || status.includes('needs') ? 'red' : status.startsWith('Saved') || status.includes('live') ? 'green' : 'gray'

  return (
    <>
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 mr-auto pl-5 max-lg:pl-3">
            <div className="text-h6 truncate" dir="auto">{names}</div>
            <span className={`label ${published ? 'label-green' : 'label-gray'}`}>{published ? 'Live' : 'Draft'}</span>
          </div>
          <Button isStroke icon="magic-pencil" className="gap-2 max-md:!px-4" onClick={openInDesigner} disabled={converting} aria-busy={converting || undefined}>Design freely</Button>
          <Button isStroke onClick={() => save()} disabled={pending} aria-busy={saving === 'save' || undefined}>Save</Button>
          <Button isBlack as="link" href={guestsHref} onClick={() => { void persist(published) }}>Guests</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <Tabs className="max-md:w-full max-md:overflow-x-auto max-md:scrollbar-none" classButton="shrink-0" items={TABS} value={tab} setValue={setTab} />
          <div className="ml-auto max-md:ml-0" aria-live="polite">{status && <Notice text={status} tone={tone} />}</div>
        </div>
      </div>

      <div className="flex max-lg:block">
        <div className="col-left">
          {tab.id === 1 && (
            <>
              <Card title="Card details">
                <div className={FORM}>
                  <Field label="Occasion" list="types" value={content.eventType} onChange={(e) => c('eventType', e.target.value)} dir="auto" />
                  <datalist id="types">{EVENT_TYPES.map((x) => <option key={x} value={x} />)}</datalist>
                  {text('Opening line', 'heading', 'Together with their families')}
                  <div className="flex gap-4 max-md:flex-col">
                    {text('Name 1', 'name1', 'e.g. bride or host', 'flex-1')}
                    {text('Name 2 (optional)', 'name2', 'e.g. groom', 'flex-1')}
                  </div>
                  {text('Hosted by', 'hosts', 'e.g. the family name')}
                  <Field label="Message" textarea value={content.message} onChange={(e) => c('message', e.target.value)} dir="auto" />
                  <Field label="Family list (one per line)" textarea classInput="!h-32" value={content.family.join('\n')} onChange={(e) => c('family', e.target.value.split('\n'))} dir="auto" />
                </div>
              </Card>
              <Card title="Sections">
                <div className="px-5 max-lg:px-3">
                  <SwitchRow title="Bismillah" note="The line at the top of the card" checked={content.showBismillah} onChange={(v) => c('showBismillah', v)} />
                  <SwitchRow title="Countdown" note="Days, hours and minutes to the first function" checked={content.showCountdown} onChange={(v) => c('showCountdown', v)} />
                  <SwitchRow title="Family list" checked={content.showFamily} onChange={(v) => c('showFamily', v)} />
                  <SwitchRow title="RSVP form" note="Guests reply on the card" checked={content.showRsvp} onChange={(v) => c('showRsvp', v)} />
                  {isStory && <>
                    <SwitchRow title="Calendar" note="A month calendar with a heart on the date" checked={content.showCalendar} onChange={(v) => c('showCalendar', v)} />
                    <SwitchRow title="Programme" note="Timeline of the day" checked={content.showProgram} onChange={(v) => c('showProgram', v)} />
                    <SwitchRow title="Dress code" checked={content.showDress} onChange={(v) => c('showDress', v)} />
                  </>}
                </div>
              </Card>
              {isStory && (
                <Card title="Programme of the day">
                  <div className={FORM}>
                    <p className="text-body-2 text-t-secondary">Leave empty to use your functions&rsquo; times.</p>
                    {content.program.map((p, i) => (
                      <div key={i} className="flex flex-col gap-3 p-3 rounded-3xl border border-s-subtle">
                        <div className="flex gap-3 items-end max-md:flex-wrap">
                          <Field className="w-32 max-md:w-[calc(50%-0.375rem)]" label="Time" type="time" value={p.time} onChange={(e) => setProg(i, 'time', e.target.value)} />
                          <Field className="flex-1 min-w-40" label="What happens" value={p.title} onChange={(e) => setProg(i, 'title', e.target.value)} dir="auto" />
                          <Button isCircle isWhite icon="trash" className="!size-10 shrink-0" onClick={() => c('program', content.program.filter((_, j) => j !== i))} aria-label="Remove" />
                        </div>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Icon">
                          {PROGRAM_ICONS.map((ic) => (
                            <button type="button" key={ic} title={ic} aria-label={ic} aria-pressed={p.icon === ic} onClick={() => setProg(i, 'icon', ic)}
                              className={`flex items-center justify-center size-10 rounded-full border transition-all [&_svg]:size-5 ${p.icon === ic ? 'border-s-stroke2 shadow-depth text-t-primary' : 'border-s-subtle text-t-tertiary hover:text-t-primary'}`}>
                              <ProgramIcon name={ic} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button isStroke icon="plus" className="gap-2 self-start" onClick={() => c('program', [...content.program, { time: '', title: '', icon: 'heart' }])}>Add to programme</Button>
                  </div>
                </Card>
              )}
              {isStory && (
                <Card title="Dress code and closing">
                  <div className={FORM}>
                    <Field label="Dress code note" textarea classInput="!h-24" value={content.dressCode} onChange={(e) => c('dressCode', e.target.value)} dir="auto" placeholder="e.g. Pastels and gold, please" />
                    <div>
                      <Label>Dress colours</Label>
                      <div className="flex flex-wrap items-center gap-3">
                        {content.dressColors.map((col, i) => (
                          <span key={i} className="relative">
                            <input type="color" value={col} aria-label={`Colour ${i + 1}`} onChange={(e) => c('dressColors', content.dressColors.map((x, j) => (j === i ? e.target.value : x)))}
                              className="block size-12 rounded-full border-2 border-s-stroke2 cursor-pointer overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full" />
                            <button type="button" aria-label="Remove colour" onClick={() => c('dressColors', content.dressColors.filter((_, j) => j !== i))}
                              className="absolute -top-1 -right-1 flex items-center justify-center size-5 rounded-full bg-b-surface2 shadow-depth text-[11px]">×</button>
                          </span>
                        ))}
                        {content.dressColors.length < 6 && <Button isCircle isStroke icon="plus" className="!size-12" aria-label="Add colour" onClick={() => c('dressColors', [...content.dressColors, design.accent])} />}
                      </div>
                    </div>
                    <Field label="Closing line" value={content.closing} onChange={(e) => c('closing', e.target.value)} dir="auto" placeholder="We are waiting for you!" />
                  </div>
                </Card>
              )}
            </>
          )}

          {tab.id === 2 && (
            <>
              <Card title="Add a function">
                <div className="px-5 pb-5 max-lg:px-3">
                  <div className="flex flex-wrap gap-2">
                    {[...QUICK_EVENTS, 'Other'].map((n) => (
                      <Button key={n} isStroke className="!h-10 !px-4 gap-1.5" icon="plus" onClick={() => addEvent(n === 'Other' ? '' : n)}>{n}</Button>
                    ))}
                  </div>
                </div>
              </Card>
              {content.events.length === 0 && (
                <div className="card"><div className="py-12 text-center text-body-2 text-t-secondary">No functions yet. Add Mehndi, Nikah, Baraat or any other above.</div></div>
              )}
              {content.events.map((e, i) => (
                <Card key={i} title={e.name || `Function ${i + 1}`} headContent={
                  <div className="flex gap-1 mr-1">
                    <Button isCircle isWhite icon="arrow" className="-rotate-90 !size-10" disabled={i === 0} onClick={() => moveEvent(i, -1)} aria-label="Move up" />
                    <Button isCircle isWhite icon="arrow" className="rotate-90 !size-10" disabled={i === content.events.length - 1} onClick={() => moveEvent(i, 1)} aria-label="Move down" />
                    <Button isCircle isWhite icon="trash" className="!size-10" onClick={() => c('events', content.events.filter((_, j) => j !== i))} aria-label="Remove" />
                  </div>
                }>
                  <div className={FORM}>
                    <Field label="Name" list="ev-types" value={e.name} onChange={(x) => setEvent(i, 'name', x.target.value)} dir="auto" placeholder="e.g. Mehndi" />
                    <div className="flex gap-4 max-md:flex-col">
                      <Field className="flex-1" label="Date" type="date" value={e.date} onChange={(x) => setEvent(i, 'date', x.target.value)} />
                      <Field className="flex-1" label="Time" type="time" value={e.time} onChange={(x) => setEvent(i, 'time', x.target.value)} />
                    </div>
                    <Field label="Venue" value={e.venue} onChange={(x) => setEvent(i, 'venue', x.target.value)} dir="auto" />
                    <Field label="Address" value={e.address} onChange={(x) => setEvent(i, 'address', x.target.value)} dir="auto" />
                  </div>
                </Card>
              ))}
              <datalist id="ev-types">{EVENT_TYPES.map((x) => <option key={x} value={x} />)}</datalist>
            </>
          )}

          {tab.id === 3 && (
            <>
              <Card title="Main photo">
                <div className={FORM}>
                  {content.photoUrl ? (
                    <div className="relative w-60 max-w-full rounded-4xl border border-s-stroke2 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="w-full aspect-square object-cover" src={content.photoUrl} alt="" />
                      <Button className="absolute top-3 right-3" icon="close" onClick={() => c('photoUrl', '')} isWhite isCircle aria-label="Remove photo" />
                    </div>
                  ) : (
                    <UploadBox label="Drop a photo" hint="Made smaller automatically" accept="image/*" disabled={!!uploading} onFiles={(f) => upload(f?.[0], 'photo')} />
                  )}
                  {content.photoUrl && <UploadBox className="!h-24" label="Change photo" accept="image/*" disabled={!!uploading} onFiles={(f) => upload(f?.[0], 'photo')} />}
                </div>
              </Card>
              <Card title={`Photo gallery (${content.gallery?.length ?? 0}/8)`}>
                <div className={FORM}>
                  {(content.gallery?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-4 gap-3 max-md:grid-cols-3">
                      {(content.gallery ?? []).map((u, i) => (
                        <div key={u} className="relative aspect-square rounded-3xl overflow-hidden border border-s-subtle">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="size-full object-cover" src={u} alt="" />
                          <Button className="absolute top-2 right-2 !size-9" icon="close" isWhite isCircle aria-label="Remove photo" onClick={() => c('gallery', content.gallery.filter((_, j) => j !== i))} />
                        </div>
                      ))}
                    </div>
                  )}
                  {(content.gallery?.length ?? 0) < 8 && <UploadBox label="Drop photos" hint="Up to 8. Photos are made smaller so the card opens fast on phones." accept="image/*" multiple disabled={!!uploading} onFiles={uploadMany} />}
                </div>
              </Card>
              <Card title="Video and music">
                <div className={FORM}>
                  <Field label="YouTube or Vimeo link" value={content.videoUrl} placeholder="https://youtu.be/…" dir="ltr" onChange={(e) => c('videoUrl', e.target.value.trim())} />
                  {content.videoUrl && !videoEmbed(content.videoUrl) && <Notice tone="red" text="This link can't be played. Use a YouTube or Vimeo link, or upload an MP4." />}
                  <UploadBox className="!h-28" label="Or upload a video (MP4, up to 30 MB)" accept="video/mp4,video/webm,video/quicktime" disabled={!!uploading} onFiles={(f) => upload(f?.[0], 'video')} />
                  {content.videoUrl && <Button className="self-start" isStroke icon="trash" onClick={() => c('videoUrl', '')}>Remove video</Button>}
                  {text('Background music (link to an .mp3)', 'musicUrl', 'https://…')}
                  {uploading && <Notice text="Uploading…" />}
                </div>
              </Card>
            </>
          )}

          {tab.id === 4 && !premium && (
            <div className="card px-12 py-16 text-center max-lg:p-8 max-lg:px-6">
              <div className="flex items-center justify-center size-16 mx-auto mb-6 border border-s-stroke2 rounded-full"><Icon className="fill-t-secondary" name="star-stroke-think" /></div>
              <div className="mb-3 text-h4 max-md:text-h5">Make it a fairy tale</div>
              <div className="max-w-142 mx-auto mb-8 text-body-1 text-t-secondary">Animated scenes (Sheesh Mahal, Chandni Raat, Gulistan, sky lanterns, marigolds, fairy castle), calligraphy names with gold foil, storybook and palace-gate openings, colours, fonts and the drag-and-drop designer. One payment for all your cards.</div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button isBlack as="link" href={`/premium?return=${encodeURIComponent(`/dashboard/${invitation.id}`)}`}>Unlock Premium</Button>
                <Button isStroke as="link" href="/templates">See templates</Button>
              </div>
              <div className="mt-4 text-caption text-t-tertiary">Free cards can still use any template as it is.</div>
            </div>
          )}

          {tab.id === 4 && premium && (
            <>
              <Card title="Card type">
                <div className={FORM}>
                  <div>
                    <Label>Layout</Label>
                    <Chips value={design.layout} options={OPTIONS.layout} onChange={setLayout} />
                  </div>
                  {isStory && <p className="-mt-4 text-body-2 text-t-secondary">A long, scrolling card: wax-seal envelope, calendar, countdown, programme, map buttons, dress code, photos and RSVP.</p>}
                </div>
              </Card>
              {isStory && (
                <Card title="Colour story">
                  <div className="grid grid-cols-5 gap-3 px-5 pb-5 max-2xl:grid-cols-3 max-md:grid-cols-2 max-lg:px-3">
                    {Object.entries(STORY_THEMES).map(([k, th]) => (
                      <button type="button" key={k} onClick={() => pickTheme(k)} aria-pressed={design.theme === k}
                        className={`flex flex-col gap-2 p-1.5 rounded-3xl border text-button transition-all ${design.theme === k ? 'border-s-stroke2 shadow-depth text-t-primary' : 'border-s-subtle text-t-secondary hover:text-t-primary'}`}>
                        <span className={`st-${k} flex items-center justify-center gap-2 h-24 rounded-[1.1rem]`} style={{ background: th.bg }}>
                          <WaxSeal initials="♥" size={44} />
                          <i className="size-5 rounded-full" style={{ background: th.paper }} />
                          <i className="size-5 rounded-full" style={{ background: th.gold }} />
                        </span>
                        <span className="pb-1.5">{th.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
              {!isStory && <>
              <Card title="Scene">
                <div className="grid grid-cols-4 gap-3 px-5 pb-5 max-2xl:grid-cols-3 max-md:grid-cols-2 max-lg:px-3" style={swatch}>
                  {OPTIONS.scene.map(([v, l]) => (
                    <button type="button" key={v} onClick={() => d('scene', v)} aria-pressed={design.scene === v}
                      className={`group flex flex-col gap-2 p-1.5 rounded-3xl border text-button transition-all ${design.scene === v ? 'border-s-stroke2 shadow-depth text-t-primary' : 'border-s-subtle text-t-secondary hover:text-t-primary'}`}>
                      <span className="scene-mini !h-24 !rounded-[1.1rem]" style={{ background: design.bg }}>{v !== 'none' ? <Scene kind={v} /> : <i className="text-t-tertiary">—</i>}</span>
                      <span className="pb-1.5">{l}</span>
                    </button>
                  ))}
                </div>
              </Card>
              <Card title="Colours">
                <div className={FORM}>
                  <div className="flex flex-wrap gap-3">
                    {PALETTES.map((p) => {
                      const on = design.bg === p.bg && design.accent === p.accent
                      return (
                        <button type="button" key={p.name} title={p.name} aria-label={p.name} aria-pressed={on}
                          className={`flex items-center justify-center size-12 rounded-full border-2 transition-shadow ${on ? 'shadow-[0_0_0_3px_var(--backgrounds-surface2),0_0_0_5px_var(--text-primary)]' : 'hover:shadow-depth'}`}
                          style={{ background: p.bg, borderColor: p.accent }}
                          onClick={() => setDesign((x) => ({ ...x, bg: p.bg, ink: p.ink, accent: p.accent }))}>
                          <i className="size-4 rounded-full" style={{ background: p.accent }} />
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                    <ColorField label="Card" value={design.bg} onChange={(v) => d('bg', v)} />
                    <ColorField label="Text" value={design.ink} onChange={(v) => d('ink', v)} />
                    <ColorField label="Gold / accent" value={design.accent} onChange={(v) => d('accent', v)} />
                  </div>
                </div>
              </Card>
              </>}
              <Card title="Names lettering">
                <div className={FORM} style={swatch}>
                  <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1 -m-1 max-2xl:grid-cols-2 max-md:grid-cols-1">
                    {SCRIPT_FONTS.map((k) => (
                      <button type="button" key={k} onClick={() => d('nameFont', k)} title={FONTS[k].label} aria-pressed={design.nameFont === k}
                        className={`flex flex-col gap-0.5 px-3 py-3 rounded-3xl border text-center transition-all ${design.nameFont === k ? 'border-s-stroke2 shadow-depth' : 'border-s-subtle hover:border-s-highlight'}`}
                        style={{ background: design.bg, color: design.accent }}>
                        <span className="text-[1.45rem] leading-snug truncate" style={{ fontFamily: FONTS[k].css }}>{names}</span>
                        <small className="text-caption opacity-75" style={{ color: design.ink }}>{FONTS[k].label}</small>
                      </button>
                    ))}
                  </div>
                  <SwitchRow title="Gold foil shimmer on names" checked={design.foil} onChange={(v) => d('foil', v)} />
                  <div className="flex gap-4 max-md:flex-col">
                    {fontSelect('Headings font', 'headingFont')}
                    {fontSelect('Text font', 'bodyFont')}
                  </div>
                </div>
              </Card>
              <Card title="Opening and effects" headContent={<Button className="mr-1 !h-10 !px-4 gap-1.5" isStroke icon="video" onClick={playOpening}>Watch the opening</Button>}>
                <div className={FORM}>
                  {isStory ? (
                    <div>
                      <Label>Opening</Label>
                      <Chips value={design.opening === 'none' ? 'none' : 'seal'} options={[['seal', 'Wax-seal envelope'], ['none', 'None']]} onChange={(v) => { d('opening', v); playOpening() }} />
                    </div>
                  ) : choice('Opening', 'opening', playOpening)}
                  {choice('Floating effect', 'effect')}
                  {!isStory && <>
                    {choice('Card style', 'cardStyle')}
                    {choice('Photo shape', 'photoShape')}
                    {choice('Background pattern', 'background')}
                  </>}
                </div>
              </Card>
            </>
          )}

          {tab.id === 5 && (
            <>
              <Card title="Link name">
                <div className={FORM}>
                  <LinkNameField invitationId={invitation.id} slug={slug} siteUrl={siteUrl} live={published} paid={sharePaid} onSaved={setSlug} />
                </div>
              </Card>
              <Card title="Personal guest links">
                <div className={FORM}>
                  <div className="text-body-2 text-t-secondary">Each guest gets their own link, like <span dir="ltr" className="text-t-primary">{siteUrl.replace(/^https?:\/\//, '')}/ali-khan</span>. The card greets them by name, and you see who opened it and who is coming. {FREE_MODE ? 'Free.' : `${rupees(PRODUCTS.links1.price)} per guest, less in bundles.`}</div>
                  <Button className="self-start" isBlack as="link" href={guestsHref}>Guest list and links</Button>
                </div>
              </Card>
              <Card title="Open link for this card">
                <div className={FORM}>
                  {published ? (
                    <>
                      <Field label="Your card link" readOnly value={link} onFocus={(e) => e.target.select()} dir="ltr" />
                      <div className="flex flex-wrap gap-2">
                        <Button isStroke icon="link" className="gap-2" onClick={() => navigator.clipboard.writeText(link).then(() => setStatus('Link copied.'))}>Copy link</Button>
                        <Button isStroke icon="send" className="gap-2" as="a" href={`https://wa.me/?text=${encodeURIComponent(`${content.heading} ${link}`)}`} target="_blank" rel="noreferrer">WhatsApp</Button>
                        <Button isStroke icon="arrow-up-right" className="gap-2" as="a" href={link} target="_blank" rel="noreferrer">Open card</Button>
                        <QrButton link={link} label="QR code" fileName={`qr-${slug}`} large />
                        <Button isStroke icon="chat" className="gap-2" as="link" href={`/dashboard/${invitation.id}/rsvps`}>Replies</Button>
                      </div>
                      <button type="button" className="self-start text-button text-t-secondary transition-colors hover:text-primary-03" onClick={() => save(false)}>Take the link offline</button>
                    </>
                  ) : sharePaid ? (
                    <>
                      <div className="text-body-2 text-t-secondary">This card&apos;s link is unlocked. Put it online again whenever you like.</div>
                      <Button className="self-start" isBlack disabled={pending} aria-busy={saving === 'publish' || undefined} onClick={() => save(true)}>Put link online</Button>
                    </>
                  ) : (
                    <Panel>
                      <div className="mb-5 text-body-2 text-t-secondary">One link anyone can open (for a WhatsApp group or Instagram).{FREE_MODE ? ' Free.' : ` Uses 1 guest link. You have ${credits}.`}</div>
                      {FREE_MODE || credits > 0
                        ? <Button className="w-full" isBlack disabled={!!saving} aria-busy={saving === 'unlock' || undefined} onClick={unlock}>{FREE_MODE ? 'Get my card link' : 'Unlock with 1 link'}</Button>
                        : <Button className="w-full" isBlack as="link" href={`/premium?return=${encodeURIComponent(`/dashboard/${invitation.id}`)}`}>Buy links</Button>}
                      <div className="mt-3 text-caption text-t-tertiary">Your full link appears here once it is unlocked.</div>
                    </Panel>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="col-right lg:sticky lg:top-22 lg:self-start">
          <Card title="Preview" headContent={<Button className="mr-1 !h-10 !px-4 gap-1.5" isStroke icon="video" onClick={playOpening}>Opening</Button>}>
            <div className="px-3 pb-3">
              <div className="phone !w-full max-w-90 !max-h-[calc(100svh-14rem)] max-lg:!max-h-none max-lg:h-160"><div className="phone-scroll">
                <InvitationView key={replay} content={content} design={design} skipOpening={!showOpening} preview />
              </div></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
