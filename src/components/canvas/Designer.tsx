'use client'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as RPointerEvent, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { saveCanvas } from '@/app/actions'
import { PAY_MESSAGES } from '../SharePaywall'
import UnlockCardLink from '../UnlockCardLink'
import QrButton from '../QrButton'
import { uploadMedia } from '@/lib/upload'
import LinkNameField from '../LinkNameField'
import {
  CANVAS_FONTS, CH, CW, MAX_ELEMENTS, ORNAMENTS, PATTERNS, createElement, newId,
  type AddKind, type CanvasBg, type CanvasDoc, type CanvasEl, type FontKey, type ImageEl, type OrnamentEl, type ShapeEl, type TextEl,
} from '@/lib/canvas'
import { backgroundStyle, elementBox, ElementBody } from './CanvasCard'
import OrnamentSvg from './OrnamentSvg'

type Props = { invitationId: string; userId: string; slug: string; siteUrl: string; initial: CanvasDoc; initialTitle: string; initialPublished: boolean; sharePaid: boolean; credits: number; payResult?: string }
type Drag =
  | { mode: 'move'; id: string; sx: number; sy: number; ox: number; oy: number }
  | { mode: 'resize'; id: string; corner: 'nw' | 'ne' | 'sw' | 'se'; sx: number; sy: number; o: { x: number; y: number; w: number; h: number } }
  | { mode: 'rotate'; id: string; cx: number; cy: number }

const SNAP = 5
const HISTORY = 80
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const round = (v: number) => Math.round(v * 10) / 10
const hex6 = (c: string) => (/^#[0-9a-f]{6}/i.test(c) ? c.slice(0, 7) : /^#[0-9a-f]{3}$/i.test(c) ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : '#000000')
const isLight = (c: string) => {
  const h = hex6(c)
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  return r * 0.299 + g * 0.587 + b * 0.114 > 150
}

const ADD_TEXT: [AddKind, string][] = [['heading', 'Heading'], ['script', 'Names (script)'], ['text', 'Paragraph']]
const ADD_SHAPES: [AddKind, string][] = [['shape:rect', 'Rectangle'], ['shape:circle', 'Circle'], ['shape:line', 'Line'], ['shape:arch', 'Arch frame']]
const ORNAMENT_LABEL: Record<string, string> = { mandala: 'Mandala', divider: 'Divider', corner: 'Corner', lantern: 'Lantern', crescent: 'Crescent', leaf: 'Leaves', flower: 'Flower', star: 'Star' }

export default function Designer({ invitationId, userId, slug, siteUrl, initial, initialTitle, initialPublished, sharePaid: paid0, credits: credits0, payResult }: Props) {
  const [sharePaid, setSharePaid] = useState(paid0)
  const [credits, setCredits] = useState(credits0)
  const [doc, setDocState] = useState<CanvasDoc>(initial)
  const [selected, setSelected] = useState<string | null>(null)
  const [title, setTitle] = useState(initialTitle)
  const [published, setPublished] = useState(initialPublished)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState(payResult ? PAY_MESSAGES[payResult] ?? '' : '')
  const [busyBtn, setBusyBtn] = useState<'save' | 'publish' | ''>('')
  const [saving, setSaving] = useState(false)
  const [panel, setPanel] = useState<'add' | 'element' | 'background' | 'layers' | 'share'>(payResult ? 'share' : 'add')
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false })
  const [fitScale, setFitScale] = useState(1)
  const [zoom, setZoom] = useState(1)

  const docRef = useRef(doc)
  docRef.current = doc
  const past = useRef<CanvasDoc[]>([])
  const future = useRef<CanvasDoc[]>([])
  const lastCoalesce = useRef<{ key: string; at: number } | null>(null)
  const drag = useRef<Drag | null>(null)
  const stageArea = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const textBox = useRef<HTMLTextAreaElement>(null)

  const scale = fitScale * zoom
  const sel = doc.elements.find((e) => e.id === selected) ?? null
  const [linkSlug, setLinkSlug] = useState(slug)
  const link = `${siteUrl}/${linkSlug}`
  const ink = isLight(doc.bg.color) ? '#2b2b2b' : '#f6efdc'
  const accent = (doc.elements.find((e) => e.type === 'ornament') as OrnamentEl | undefined)?.color ?? (isLight(doc.bg.color) ? '#b8892b' : '#d4af37')

  // ---- history -------------------------------------------------------------------------
  const pushPast = useCallback((snapshot: CanvasDoc) => {
    past.current.push(snapshot)
    if (past.current.length > HISTORY) past.current.shift()
    future.current = []
  }, [])

  /** Replace the document. `coalesce` merges rapid edits of the same field into one undo step. */
  const commit = useCallback((next: CanvasDoc, coalesce?: string) => {
    const now = Date.now()
    const last = lastCoalesce.current
    if (!(coalesce && last && last.key === coalesce && now - last.at < 800)) pushPast(docRef.current)
    lastCoalesce.current = coalesce ? { key: coalesce, at: now } : null
    docRef.current = next
    setDocState(next)
    setDirty(true)
  }, [pushPast])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(docRef.current)
    lastCoalesce.current = null
    docRef.current = prev; setDocState(prev); setDirty(true)
  }, [])
  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(docRef.current)
    lastCoalesce.current = null
    docRef.current = next; setDocState(next); setDirty(true)
  }, [])

  const updateEl = useCallback((id: string, patch: Partial<CanvasEl>, coalesce?: string) => {
    const d = docRef.current
    commit({ ...d, elements: d.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as CanvasEl) : e)) }, coalesce ? `${id}:${coalesce}` : undefined)
  }, [commit])
  const updateBg = (patch: Partial<CanvasBg>, coalesce?: string) => commit({ ...docRef.current, bg: { ...docRef.current.bg, ...patch } }, coalesce ? `bg:${coalesce}` : undefined)

  // ---- element operations ----------------------------------------------------------------
  const add = (kind: AddKind, at?: { x: number; y: number }) => {
    if (docRef.current.elements.length >= MAX_ELEMENTS) return setStatus(`A card can hold up to ${MAX_ELEMENTS} elements.`)
    const el = createElement(kind, at, accent, ink)
    commit({ ...docRef.current, elements: [...docRef.current.elements, el] })
    setSelected(el.id); setPanel('element')
    if (el.type === 'text') setTimeout(() => { textBox.current?.focus(); textBox.current?.select() }, 50)
  }
  const remove = (id: string) => {
    commit({ ...docRef.current, elements: docRef.current.elements.filter((e) => e.id !== id) })
    setSelected(null); setPanel('add')
  }
  const duplicate = (id: string) => {
    const d = docRef.current
    const src = d.elements.find((e) => e.id === id)
    if (!src || d.elements.length >= MAX_ELEMENTS) return
    const copy = { ...src, id: newId(), x: src.x + 12, y: src.y + 12, locked: false } as CanvasEl
    const i = d.elements.indexOf(src)
    commit({ ...d, elements: [...d.elements.slice(0, i + 1), copy, ...d.elements.slice(i + 1)] })
    setSelected(copy.id)
  }
  const reorder = (id: string, dir: 1 | -1 | 'top' | 'bottom') => {
    const els = docRef.current.elements.slice()
    const i = els.findIndex((e) => e.id === id)
    if (i < 0) return
    const [el] = els.splice(i, 1)
    const j = dir === 'top' ? els.length : dir === 'bottom' ? 0 : clamp(i + dir, 0, els.length)
    els.splice(j, 0, el)
    commit({ ...docRef.current, elements: els })
  }
  const centre = (id: string, axis: 'x' | 'y') => {
    const el = docRef.current.elements.find((e) => e.id === id)
    if (el) updateEl(id, axis === 'x' ? { x: round((CW - el.w) / 2) } : { y: round((CH - el.h) / 2) })
  }

  // ---- fit the card to the screen ---------------------------------------------------------
  useEffect(() => {
    const area = stageArea.current
    if (!area) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setFitScale(clamp(Math.min((width - 48) / CW, (height - 48) / CH), 0.4, 1.6))
    })
    ro.observe(area)
    return () => ro.disconnect()
  }, [])

  // ---- pointer interactions ------------------------------------------------------------
  const toCanvas = (clientX: number, clientY: number) => {
    const r = stage.current!.getBoundingClientRect()
    return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale }
  }

  const onMove = useCallback((e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const cur = docRef.current
    const el = cur.elements.find((x) => x.id === d.id)
    if (!el) return
    let patch: Partial<CanvasEl> = {}
    const g = { v: false, h: false }
    if (d.mode === 'move') {
      let x = d.ox + (e.clientX - d.sx) / scale
      let y = d.oy + (e.clientY - d.sy) / scale
      if (!e.altKey) {
        if (Math.abs(x + el.w / 2 - CW / 2) < SNAP) { x = CW / 2 - el.w / 2; g.v = true }
        if (Math.abs(y + el.h / 2 - CH / 2) < SNAP) { y = CH / 2 - el.h / 2; g.h = true }
        if (Math.abs(x) < SNAP) x = 0
        if (Math.abs(x + el.w - CW) < SNAP) x = CW - el.w
        if (Math.abs(y) < SNAP) y = 0
        if (Math.abs(y + el.h - CH) < SNAP) y = CH - el.h
      }
      patch = { x: round(x), y: round(y) }
    } else if (d.mode === 'resize') {
      const dx = (e.clientX - d.sx) / scale
      const dy = (e.clientY - d.sy) / scale
      let { x, y, w, h } = d.o
      if (d.corner.includes('e')) w = d.o.w + dx
      if (d.corner.includes('w')) { w = d.o.w - dx; x = d.o.x + dx }
      if (d.corner.includes('s')) h = d.o.h + dy
      if (d.corner.includes('n')) { h = d.o.h - dy; y = d.o.y + dy }
      const keepRatio = e.shiftKey || el.type === 'ornament' || (el.type === 'shape' && el.shape === 'circle')
      if (keepRatio) {
        const ratio = d.o.w / d.o.h
        if (Math.abs(w - d.o.w) / d.o.w > Math.abs(h - d.o.h) / d.o.h) h = w / ratio
        else w = h * ratio
        if (d.corner.includes('w')) x = d.o.x + d.o.w - w
        if (d.corner.includes('n')) y = d.o.y + d.o.h - h
      }
      const minH = el.type === 'shape' && el.shape === 'line' ? 1 : 8
      const minW = el.type === 'shape' && el.shape === 'line' ? 1 : 8
      if (w < minW) { if (d.corner.includes('w')) x -= minW - w; w = minW }
      if (h < minH) { if (d.corner.includes('n')) y -= minH - h; h = minH }
      patch = { x: round(x), y: round(y), w: round(w), h: round(h) }
    } else {
      const p = toCanvas(e.clientX, e.clientY)
      let deg = (Math.atan2(p.y - d.cy, p.x - d.cx) * 180) / Math.PI + 90
      if (deg > 180) deg -= 360
      if (e.shiftKey) deg = Math.round(deg / 15) * 15
      else for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(deg - s) < 4) deg = s
      patch = { rotate: Math.round(deg) }
    }
    setGuides(g)
    const next = { ...cur, elements: cur.elements.map((x) => (x.id === d.id ? ({ ...x, ...patch } as CanvasEl) : x)) }
    docRef.current = next
    setDocState(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale])

  const onUp = useCallback(() => {
    drag.current = null
    setGuides({ v: false, h: false })
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }, [onMove])

  const startDrag = (e: RPointerEvent, d: Drag) => {
    e.preventDefault(); e.stopPropagation()
    pushPast(docRef.current)
    lastCoalesce.current = null
    setDirty(true)
    drag.current = d
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onElementDown = (e: RPointerEvent, el: CanvasEl) => {
    if (e.button !== 0) return
    setSelected(el.id); setPanel('element')
    if (el.locked) return
    startDrag(e, { mode: 'move', id: el.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y })
  }

  useEffect(() => () => onUp(), [onUp])

  // ---- drag from the sidebar onto the card -------------------------------------------------
  const onDropAdd = (e: DragEvent) => {
    const kind = e.dataTransfer.getData('application/x-dawat-element') as AddKind
    if (!kind) return
    e.preventDefault()
    add(kind, toCanvas(e.clientX, e.clientY))
  }
  const draggable = (kind: AddKind) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => { e.dataTransfer.setData('application/x-dawat-element', kind); e.dataTransfer.effectAllowed = 'copy' },
  })

  // ---- keyboard ------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.closest('input, textarea, select, [contenteditable="true"]')
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); return e.shiftKey ? redo() : undo() }
      if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); return redo() }
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); void save(); return }
      if (typing || !selected) return
      const el = docRef.current.elements.find((x) => x.id === selected)
      if (!el) return
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(el.id) }
      else if (e.key === 'Escape') { setSelected(null); setPanel('add') }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(el.id) }
      else if (e.key.startsWith('Arrow') && !el.locked) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        updateEl(el.id, { x: el.x + dx, y: el.y + dy }, 'nudge')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // ---- saving & uploads -------------------------------------------------------------------
  async function save(publish?: boolean): Promise<boolean> {
    setSaving(true); setBusyBtn(publish && !published ? 'publish' : 'save'); setStatus('Saving…')
    const res = await saveCanvas(invitationId, { doc: docRef.current, title, published: publish ?? published })
    setSaving(false); setBusyBtn('')
    if (!res.ok) { setStatus(res.error ?? 'Could not save.'); return false }
    setPublished(res.published)
    setDirty(false)
    setStatus(res.published ? 'Saved. Your link shows the latest version.' : 'Saved.')
    if (publish) setPanel('share')
    return true
  }

  async function upload(file: File | undefined, apply: (url: string) => void) {
    if (!file) return
    setStatus('Shrinking and uploading image…')
    try {
      apply(await uploadMedia(file, userId, `canvas-${invitationId}`))
      setStatus('Image added.')
    } catch (e) { setStatus((e as Error).message) }
  }


  const ornamentChoices = useMemo(() => ORNAMENTS.map((o) => [`ornament:${o}` as AddKind, ORNAMENT_LABEL[o], o] as const), [])

  // ---- render -------------------------------------------------------------------------------
  return (
    <div className="designer">
      <aside className="dz-side" aria-label="Designer controls">
        <header className="dz-head">
          <Link href="/dashboard" className="dz-back">← My invitations</Link>
          <input className="dz-title" value={title} maxLength={80} aria-label="Card name"
            onChange={(e) => { setTitle(e.target.value); setDirty(true) }} />
          <span className={`pill ${published ? 'live' : ''}`}>{published ? 'Live' : 'Draft'}</span>
        </header>

        <nav className="dz-tabs" role="tablist">
          {([['add', 'Add'], ['element', 'Edit'], ['background', 'Background'], ['layers', 'Layers'], ['share', 'Share']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={panel === k} className={panel === k ? 'on' : ''} onClick={() => setPanel(k)}>{l}</button>
          ))}
        </nav>

        <div className="dz-body">
          {panel === 'add' && (
            <>
              <p className="dz-hint">Drag an item onto the card, or click to add it in the middle.</p>
              <Section title="Text">
                <div className="dz-grid">
                  {ADD_TEXT.map(([k, l]) => <button key={k} className="dz-tile" {...draggable(k)} onClick={() => add(k)}><span className={`dz-sample ${k}`}>Aa</span>{l}</button>)}
                </div>
              </Section>
              <Section title="Photo">
                <button className="dz-tile wide" {...draggable('image')} onClick={() => add('image')}><span className="dz-sample image" />Photo frame</button>
              </Section>
              <Section title="Shapes">
                <div className="dz-grid">
                  {ADD_SHAPES.map(([k, l]) => <button key={k} className="dz-tile" {...draggable(k)} onClick={() => add(k)}><span className={`dz-shape ${k.slice(6)}`} />{l}</button>)}
                </div>
              </Section>
              <Section title="Ornaments">
                <div className="dz-grid">
                  {ornamentChoices.map(([k, l, o]) => (
                    <button key={k} className="dz-tile" {...draggable(k)} onClick={() => add(k)}>
                      <span className="dz-orn" style={{ color: accent }}><OrnamentSvg name={o} /></span>{l}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {panel === 'element' && !sel && <p className="muted">Click any element on the card to edit it.</p>}
          {panel === 'element' && sel && (
            <ElementPanel el={sel} textBox={textBox} update={(p, c) => updateEl(sel.id, p, c)}
              onUpload={(f) => upload(f, (url) => updateEl(sel.id, { src: url } as Partial<ImageEl>))}
              onDelete={() => remove(sel.id)} onDuplicate={() => duplicate(sel.id)}
              onOrder={(d) => reorder(sel.id, d)} onCentre={(a) => centre(sel.id, a)} />
          )}

          {panel === 'background' && (
            <>
              <Section title="Colour">
                <div className="two">
                  <label>Card colour<input type="color" value={hex6(doc.bg.color)} onChange={(e) => updateBg({ color: e.target.value }, 'color')} /></label>
                  <label className={doc.bg.gradient ? '' : 'dim'}>Second colour<input type="color" value={hex6(doc.bg.color2)} disabled={!doc.bg.gradient} onChange={(e) => updateBg({ color2: e.target.value }, 'color2')} /></label>
                </div>
                <label className="check"><input type="checkbox" checked={doc.bg.gradient} onChange={(e) => updateBg({ gradient: e.target.checked })} />Blend into the second colour</label>
              </Section>
              <Section title="Pattern">
                <div className="chips">
                  {PATTERNS.map((p) => <button key={p} type="button" className={doc.bg.pattern === p ? 'on' : ''} onClick={() => updateBg({ pattern: p })}>{p === 'none' ? 'None' : p[0].toUpperCase() + p.slice(1)}</button>)}
                </div>
                {doc.bg.pattern !== 'none' && <label>Pattern colour<input type="color" value={hex6(doc.bg.patternColor)} onChange={(e) => updateBg({ patternColor: e.target.value }, 'pc')} /></label>}
              </Section>
              <Section title="Background photo">
                <label className="file">{doc.bg.image ? 'Replace photo' : 'Upload a photo'}
                  <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], (url) => updateBg({ image: url }))} />
                </label>
                {doc.bg.image && <button type="button" className="link" onClick={() => updateBg({ image: '' })}>Remove photo</button>}
              </Section>
            </>
          )}

          {panel === 'layers' && (
            <>
              <p className="dz-hint">Top of the list is in front.</p>
              <ol className="dz-layers">
                {doc.elements.slice().reverse().map((el) => (
                  <li key={el.id} className={el.id === selected ? 'on' : ''}>
                    <button className="dz-layer-name" onClick={() => { setSelected(el.id); setPanel('element') }}>{layerLabel(el)}</button>
                    <button title="Bring forward" aria-label="Bring forward" onClick={() => reorder(el.id, 1)}>↑</button>
                    <button title="Send backward" aria-label="Send backward" onClick={() => reorder(el.id, -1)}>↓</button>
                    <button title={el.locked ? 'Unlock' : 'Lock'} aria-label={el.locked ? 'Unlock' : 'Lock'} onClick={() => updateEl(el.id, { locked: !el.locked })}>{el.locked ? '🔒' : '🔓'}</button>
                    <button title="Delete" aria-label="Delete" onClick={() => remove(el.id)}>✕</button>
                  </li>
                ))}
              </ol>
              {doc.elements.length === 0 && <p className="muted">The card is empty. Add something from the Add tab.</p>}
            </>
          )}

          {panel === 'share' && (
            <div className="share-box">
              <h3>Personal guest links</h3>
              <p className="muted">Each guest gets their own link that greets them by name. You see who opened it and who is coming.</p>
              <Link className="btn small" href={`/dashboard/${invitationId}/guests`}>Guest list and links</Link>
            </div>
          )}
          {panel === 'share' && <LinkNameField invitationId={invitationId} slug={linkSlug} siteUrl={siteUrl} live={published} paid={sharePaid} onSaved={setLinkSlug} />}
          {panel === 'share' && (
            published ? (
              <>
                <label>Your card link<input readOnly value={link} onFocus={(e) => e.target.select()} dir="ltr" /></label>
                <div className="chips">
                  <button type="button" onClick={() => navigator.clipboard.writeText(link).then(() => setStatus('Link copied.'), () => setStatus('Copy failed. Select the link and copy it.'))}>Copy link</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${link}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
                  <a href={link} target="_blank" rel="noreferrer">Open card</a>
                  <QrButton link={link} label="QR code" fileName={`qr-${linkSlug}`} />
                </div>
                <p className="muted">Anyone with the link can open the card in their browser. Changes you save show up on the same link.</p>
                <button type="button" className="link" onClick={() => save(false)}>Unpublish (take the link offline)</button>
              </>
            ) : sharePaid ? (
              <>
                <p className="muted">This card is paid for. Publish it to put the link online again.</p>
                <button className="btn" disabled={saving} aria-busy={busyBtn === 'publish'} onClick={() => save(true)}>Publish and get link</button>
              </>
            ) : (
              <UnlockCardLink invitationId={invitationId} credits={credits} returnTo={`/design/${invitationId}`} beforeUnlock={() => save(false)}
                onUnlocked={() => { setSharePaid(true); setPublished(true); setCredits((n) => Math.max(0, n - 1)); setStatus('Your card link is live.') }} />
            )
          )}
        </div>

        <footer className="dz-foot">
          <small aria-live="polite">{status || (dirty ? 'Unsaved changes' : 'All changes saved')}</small>
          <div>
            <button className="btn ghost small" disabled={saving} aria-busy={busyBtn === 'save'} onClick={() => save()}>Save</button>
            {!published && sharePaid && <button className="btn small" disabled={saving} aria-busy={busyBtn === 'publish'} onClick={() => save(true)}>Publish</button>}
            <Link className="btn small" href={`/dashboard/${invitationId}/guests`}>Guests</Link>
          </div>
        </footer>
      </aside>

      <section className="dz-main">
        <div className="dz-toolbar" role="toolbar" aria-label="Card tools">
          <button onClick={undo} disabled={!past.current.length} title="Undo (Ctrl+Z)">↶ Undo</button>
          <button onClick={redo} disabled={!future.current.length} title="Redo (Ctrl+Y)">↷ Redo</button>
          <span className="dz-sep" />
          <button onClick={() => setZoom((z) => clamp(round(z - 0.1), 0.5, 2))} aria-label="Zoom out">−</button>
          <button onClick={() => setZoom(1)} title="Fit to screen">{Math.round(scale * 100)}%</button>
          <button onClick={() => setZoom((z) => clamp(round(z + 0.1), 0.5, 2))} aria-label="Zoom in">+</button>
          {sel && (
            <>
              <span className="dz-sep" />
              <button onClick={() => duplicate(sel.id)} title="Duplicate (Ctrl+D)">Duplicate</button>
              <button onClick={() => remove(sel.id)} title="Delete">Delete</button>
            </>
          )}
        </div>
        <div className="dz-stage-area" ref={stageArea}
          onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="dz-stage-wrap" style={{ width: CW * scale, height: CH * scale }}>
            <div ref={stage} className="dz-stage cv" style={{ ...backgroundStyle(doc.bg), width: CW * scale, height: CH * scale }}
              onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-dawat-element')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } }}
              onDrop={onDropAdd}
              onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
              {doc.elements.map((el) => (
                <div key={el.id} className={`dz-el ${el.id === selected ? 'sel' : ''} ${el.locked ? 'locked' : ''}`} style={elementBox(el)}
                  onPointerDown={(e) => onElementDown(e, el)}
                  onDoubleClick={() => { if (el.type === 'text') { setPanel('element'); setTimeout(() => textBox.current?.focus(), 30) } }}>
                  <ElementBody el={el} />
                  {el.id === selected && !el.locked && (
                    <>
                      {(['nw', 'ne', 'sw', 'se'] as const).map((c) => (
                        <span key={c} className={`dz-h ${c}`} aria-hidden="true"
                          onPointerDown={(e) => startDrag(e, { mode: 'resize', id: el.id, corner: c, sx: e.clientX, sy: e.clientY, o: { x: el.x, y: el.y, w: el.w, h: el.h } })} />
                      ))}
                      <span className="dz-rot" aria-hidden="true" title="Rotate (Shift for 15° steps)"
                        onPointerDown={(e) => startDrag(e, { mode: 'rotate', id: el.id, cx: el.x + el.w / 2, cy: el.y + el.h / 2 })} />
                    </>
                  )}
                </div>
              ))}
              {guides.v && <span className="dz-guide v" />}
              {guides.h && <span className="dz-guide h" />}
            </div>
          </div>
        </div>
        <p className="dz-tips">Drag to move · corners to resize (Shift keeps shape) · top dot to rotate · arrow keys to nudge · Delete to remove</p>
      </section>
    </div>
  )
}

function layerLabel(el: CanvasEl) {
  if (el.type === 'text') return `T  ${el.text.split('\n')[0].slice(0, 28) || 'Text'}`
  if (el.type === 'image') return '▣  Photo'
  if (el.type === 'shape') return `◇  ${el.shape[0].toUpperCase()}${el.shape.slice(1)}`
  return `✿  ${ORNAMENT_LABEL[el.name]}`
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <fieldset className="dz-sec"><legend>{title}</legend>{children}</fieldset>
}

type ElProps = {
  el: CanvasEl
  textBox: RefObject<HTMLTextAreaElement | null>
  update: (patch: Partial<CanvasEl>, coalesce?: string) => void
  onUpload: (f: File | undefined) => void
  onDelete: () => void
  onDuplicate: () => void
  onOrder: (d: 1 | -1 | 'top' | 'bottom') => void
  onCentre: (a: 'x' | 'y') => void
}

function ElementPanel({ el, textBox, update, onUpload, onDelete, onDuplicate, onOrder, onCentre }: ElProps) {
  const n = (label: string, k: 'x' | 'y' | 'w' | 'h') => (
    <label>{label}<input type="number" step="1" value={Math.round(el[k])} onChange={(e) => update({ [k]: Number(e.target.value) || 0 } as Partial<CanvasEl>, k)} /></label>
  )
  const slider = (label: string, value: number, min: number, max: number, step: number, apply: (v: number) => void, key: string, unit = '') => (
    <label>{label} <output>{Math.round(value * 100) / 100}{unit}</output>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => apply(Number(e.target.value))} data-key={key} />
    </label>
  )
  return (
    <>
      {el.type === 'text' && <TextProps el={el} textBox={textBox} update={update} slider={slider} />}
      {el.type === 'image' && <ImageProps el={el} update={update} onUpload={onUpload} slider={slider} />}
      {el.type === 'shape' && <ShapeProps el={el} update={update} slider={slider} />}
      {el.type === 'ornament' && <OrnamentProps el={el} update={update} />}

      <Section title="Position and size">
        <div className="four">{n('X', 'x')}{n('Y', 'y')}{n('Width', 'w')}{n('Height', 'h')}</div>
        {slider('Rotation', el.rotate, -180, 180, 1, (v) => update({ rotate: v }, 'rotate'), 'rotate', '°')}
        {slider('Opacity', el.opacity, 0.05, 1, 0.05, (v) => update({ opacity: v }, 'opacity'), 'opacity')}
        <div className="chips">
          <button type="button" onClick={() => onCentre('x')}>Centre across</button>
          <button type="button" onClick={() => onCentre('y')}>Centre down</button>
          <button type="button" onClick={() => onOrder('top')}>Bring to front</button>
          <button type="button" onClick={() => onOrder('bottom')}>Send to back</button>
        </div>
        <label className="check"><input type="checkbox" checked={el.locked} onChange={(e) => update({ locked: e.target.checked })} />Lock (stop it moving by accident)</label>
      </Section>
      <div className="chips">
        <button type="button" onClick={onDuplicate}>Duplicate</button>
        <button type="button" className="danger" onClick={onDelete}>Delete</button>
      </div>
    </>
  )
}

type Slider = (label: string, value: number, min: number, max: number, step: number, apply: (v: number) => void, key: string, unit?: string) => ReactNode

function TextProps({ el, textBox, update, slider }: { el: TextEl; textBox: ElProps['textBox']; update: ElProps['update']; slider: Slider }) {
  return (
    <Section title="Text">
      <label>Text<textarea ref={textBox} rows={3} value={el.text} maxLength={600} dir="auto" onChange={(e) => update({ text: e.target.value }, 'text')} /></label>
      <div className="two">
        <label>Font
          <select value={el.font} onChange={(e) => update({ font: e.target.value as FontKey })}>
            {Object.entries(CANVAS_FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
          </select>
        </label>
        <label>Colour<input type="color" value={hex6(el.color)} onChange={(e) => update({ color: e.target.value }, 'color')} /></label>
      </div>
      {slider('Size', el.size, 6, 120, 1, (v) => update({ size: v }, 'size'), 'size', 'px')}
      <div className="chips">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button key={a} type="button" className={el.align === a ? 'on' : ''} onClick={() => update({ align: a })}>{a === 'center' ? 'Centre' : a[0].toUpperCase() + a.slice(1)}</button>
        ))}
        <button type="button" className={el.weight >= 600 ? 'on' : ''} onClick={() => update({ weight: el.weight >= 600 ? 400 : 700 })}><b>B</b></button>
        <button type="button" className={el.italic ? 'on' : ''} onClick={() => update({ italic: !el.italic })}><i>I</i></button>
        <button type="button" className={el.upper ? 'on' : ''} onClick={() => update({ upper: !el.upper })}>AA</button>
      </div>
      {slider('Letter spacing', el.spacing, -2, 12, 0.5, (v) => update({ spacing: v }, 'spacing'), 'spacing')}
      {slider('Line height', el.lineHeight, 0.8, 2.5, 0.05, (v) => update({ lineHeight: v }, 'lh'), 'lh')}
    </Section>
  )
}

function ImageProps({ el, update, onUpload, slider }: { el: ImageEl; update: ElProps['update']; onUpload: ElProps['onUpload']; slider: Slider }) {
  return (
    <Section title="Photo">
      <label className="file">{el.src ? 'Replace photo' : 'Upload a photo'}<input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} /></label>
      {el.src && <button type="button" className="link" onClick={() => update({ src: '' } as Partial<ImageEl>)}>Remove photo</button>}
      {slider('Rounded corners', el.radius, 0, 50, 1, (v) => update({ radius: v } as Partial<ImageEl>, 'radius'), 'radius', '%')}
      <div className="chips">
        <button type="button" className={el.fit === 'cover' ? 'on' : ''} onClick={() => update({ fit: 'cover' } as Partial<ImageEl>)}>Fill frame</button>
        <button type="button" className={el.fit === 'contain' ? 'on' : ''} onClick={() => update({ fit: 'contain' } as Partial<ImageEl>)}>Show whole photo</button>
      </div>
      <div className="two">
        {slider('Border', el.border, 0, 12, 1, (v) => update({ border: v } as Partial<ImageEl>, 'border'), 'border', 'px')}
        <label>Border colour<input type="color" value={hex6(el.borderColor)} onChange={(e) => update({ borderColor: e.target.value } as Partial<ImageEl>, 'bc')} /></label>
      </div>
    </Section>
  )
}

function ShapeProps({ el, update, slider }: { el: ShapeEl; update: ElProps['update']; slider: Slider }) {
  const line = el.shape === 'line'
  return (
    <Section title="Shape">
      {!line && (
        <div className="two">
          <label className={el.fill === 'transparent' ? 'dim' : ''}>Fill<input type="color" value={el.fill === 'transparent' ? '#ffffff' : hex6(el.fill)} onChange={(e) => update({ fill: e.target.value } as Partial<ShapeEl>, 'fill')} /></label>
          <label className="check"><input type="checkbox" checked={el.fill === 'transparent'} onChange={(e) => update({ fill: e.target.checked ? 'transparent' : '#ffffff' } as Partial<ShapeEl>)} />No fill</label>
        </div>
      )}
      <label>{line ? 'Colour' : 'Outline colour'}<input type="color" value={hex6(el.stroke)} onChange={(e) => update({ stroke: e.target.value } as Partial<ShapeEl>, 'stroke')} /></label>
      {!line && slider('Outline width', el.strokeWidth, 0, 12, 0.5, (v) => update({ strokeWidth: v } as Partial<ShapeEl>, 'sw'), 'sw', 'px')}
      {el.shape === 'rect' && slider('Rounded corners', el.radius, 0, 80, 1, (v) => update({ radius: v } as Partial<ShapeEl>, 'radius'), 'radius', 'px')}
    </Section>
  )
}

function OrnamentProps({ el, update }: { el: OrnamentEl; update: ElProps['update'] }) {
  return (
    <Section title="Ornament">
      <div className="dz-grid small">
        {ORNAMENTS.map((o) => (
          <button key={o} type="button" className={`dz-tile ${el.name === o ? 'on' : ''}`} onClick={() => update({ name: o } as Partial<OrnamentEl>)} title={ORNAMENT_LABEL[o]}>
            <span className="dz-orn" style={{ color: el.color }}><OrnamentSvg name={o} /></span>
          </button>
        ))}
      </div>
      <label>Colour<input type="color" value={hex6(el.color)} onChange={(e) => update({ color: e.target.value } as Partial<OrnamentEl>, 'color')} /></label>
    </Section>
  )
}
