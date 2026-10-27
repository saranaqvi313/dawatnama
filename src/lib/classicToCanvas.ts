/**
 * Turns a form-built ("quick edit") card into a drag-and-drop designer card, so any template can
 * be edited freely: every line becomes its own movable text, the fairy-tale scene, opening,
 * floating effect, photos, gallery, video and music come along.
 */
import { CANVAS_FONTS, CW, MAX_H, MIN_H, SCENE_NAMES, newId, sanitizeCanvas, type CanvasDoc, type CanvasEl, type FontKey, type OpeningName, type PatternName, type SceneName, type EffectName } from './canvas'
import type { Content, Design } from './types'

const font = (k: string, d: FontKey): FontKey => (k in CANVAS_FONTS ? (k as FontKey) : d)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function when(date: string, time: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '')
  let out = date || ''
  if (m) { const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); out = `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
  const t = /^(\d{1,2}):(\d{2})/.exec(time || '')
  if (t) { const h = +t[1]; out += ` · ${h % 12 || 12}:${t[2]} ${h < 12 ? 'am' : 'pm'}` }
  return out
}

export function classicToCanvas(content: Content, design: Design): CanvasDoc {
  const els: CanvasEl[] = []
  const accent = design.accent, ink = design.ink
  const hfont = font(design.headingFont, 'cormorant'), bfont = font(design.bodyFont, 'poppins'), nfont = font(design.nameFont, 'pinyon')
  let y = 40
  let order = 0
  const text = (t: string, h: number, o: Record<string, unknown>) => {
    if (!t.trim()) return
    els.push({ id: newId(), type: 'text', text: t, x: 30, y, w: CW - 60, h, rotate: 0, opacity: 1, locked: false, font: bfont, size: 14, color: ink, weight: 400,
      italic: false, align: 'center', spacing: 0, lineHeight: 1.4, upper: false, foil: false, shadow: false, bg: 'transparent', underline: false,
      anim: 'rise', delay: Math.round(order++ * 1.5) / 10, link: '', ...o } as CanvasEl)
    y += h + 10
  }

  const scene = SCENE_NAMES.includes(design.scene as SceneName) ? (design.scene as SceneName) : null
  if (scene) y = 150 // leave the top for the scene's arch

  if (content.showBismillah) text('In the name of Allah, the Most Gracious, the Most Merciful', 40, { font: hfont, italic: true, size: 13, color: accent })
  text(content.eventType || '', 20, { size: 11, upper: true, spacing: 4, color: accent })
  text(content.heading || '', 40, { font: hfont, size: 15 })
  if (content.photoUrl) {
    els.push({ id: newId(), type: 'image', src: content.photoUrl, x: (CW - 170) / 2, y, w: 170, h: design.photoShape === 'arch' ? 220 : 170, rotate: 0, opacity: 1, locked: false,
      radius: design.photoShape === 'rounded' ? 10 : 50, fit: 'cover', border: 2, borderColor: accent, filter: 'none', mask: design.photoShape === 'arch' ? 'arch' : 'none', shadow: true,
      anim: 'zoom', delay: 0.3, link: '' } as CanvasEl)
    y += (design.photoShape === 'arch' ? 220 : 170) + 14
  }
  const given = [content.name1, content.name2].filter(Boolean)
  // Templates come without names: show where they go.
  const names = given.length ? given : content.eventType && /nikah|baraat|walima|shaadi|mehndi|mayun|wedding|engagement|mangni|dholki/i.test(content.eventType) ? ['Bride', 'Groom'] : ['Your name']
  if (names.length === 2) {
    text(names[0], 64, { font: nfont, size: 46, color: accent, foil: design.foil, lineHeight: 1.1, anim: 'blur' })
    text('&', 30, { font: hfont, size: 22, color: accent })
    text(names[1], 64, { font: nfont, size: 46, color: accent, foil: design.foil, lineHeight: 1.1, anim: 'blur' })
  } else if (names.length === 1) text(names[0], 70, { font: nfont, size: 48, color: accent, foil: design.foil, anim: 'blur' })
  if (content.hosts) text(content.hosts, 30, { font: hfont, italic: true, size: 15 })
  els.push({ id: newId(), type: 'ornament', name: 'divider', x: (CW - 200) / 2, y, w: 200, h: 34, rotate: 0, opacity: 1, locked: false, color: accent, anim: 'fade', delay: 0.6, link: '' } as CanvasEl)
  y += 46
  text(content.message || '', 60, { font: hfont, size: 16, lineHeight: 1.45 })

  for (const e of content.events ?? []) {
    y += 8
    text(e.name || 'Function', 34, { font: hfont, size: 24, weight: 600, color: accent })
    text(when(e.date, e.time), 24, { font: bfont, size: 13 })
    const place = [e.venue, e.address].filter(Boolean).join('\n')
    if (place) {
      const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue} ${e.address}`)}`
      text(place, 44, { font: bfont, size: 12, lineHeight: 1.45, link: map })
    }
  }
  const program = content.showProgram ? (content.program ?? []).filter((p) => p.title) : []
  if (program.length) {
    y += 8
    text('Programme', 30, { font: hfont, size: 20, color: accent })
    text(program.map((p) => `${p.time}  ·  ${p.title}`).join('\n'), Math.min(220, 22 * program.length), { font: bfont, size: 13, lineHeight: 1.6 })
  }
  if (content.showDress && content.dressCode) {
    y += 8
    text('Dress code', 30, { font: hfont, size: 20, color: accent })
    text(content.dressCode, 40, { font: bfont, size: 13, lineHeight: 1.45 })
  }
  if (content.closing && design.layout === 'story') text(content.closing, 50, { font: nfont, size: 32, color: accent })
  if (content.showFamily && content.family?.filter(Boolean).length) {
    y += 8
    text('Awaiting your arrival', 30, { font: hfont, size: 20, color: accent })
    text(content.family.filter(Boolean).join('\n'), Math.min(200, 22 * content.family.filter(Boolean).length), { size: 13, lineHeight: 1.6 })
  }
  const gallery = (content.gallery ?? []).slice(0, 4)
  if (gallery.length) {
    y += 8
    const size = gallery.length === 1 ? 300 : 145
    gallery.forEach((src, i) => {
      els.push({ id: newId(), type: 'image', src, x: gallery.length === 1 ? 30 : 30 + (i % 2) * 155, y: y + Math.floor(i / 2) * (size + 10), w: size, h: size, rotate: 0, opacity: 1, locked: false,
        radius: 6, fit: 'cover', border: 0, borderColor: accent, filter: 'none', mask: 'none', shadow: true, anim: 'fade', delay: 0, link: '' } as CanvasEl)
    })
    y += Math.ceil(gallery.length / 2) * (size + 10) + 6
  }
  if (content.videoUrl) {
    els.push({ id: newId(), type: 'video', src: content.videoUrl, x: 30, y, w: 300, h: 170, rotate: 0, opacity: 1, locked: false, radius: 4, border: 0, borderColor: accent, autoplay: false, anim: 'fade', delay: 0, link: '' } as CanvasEl)
    y += 186
  }
  const h = Math.min(MAX_H, Math.max(MIN_H, Math.ceil((y + (scene ? 140 : 50)) / 40) * 40))
  if (scene) els.unshift({ id: newId(), type: 'scene', name: scene, x: 0, y: 0, w: CW, h, rotate: 0, opacity: 1, locked: true, color: accent, anim: 'none', delay: 0, link: '' } as CanvasEl)

  const pattern: PatternName = ['geometric', 'floral', 'arches'].includes(design.background) ? (design.background as PatternName) : design.background === 'jaali' || design.background === 'paisley' ? 'geometric' : 'none'
  return sanitizeCanvas({
    v: 1, h,
    bg: { color: design.bg, color2: design.bg, gradient: false, pattern, patternColor: accent, image: '', imageOpacity: 1 },
    fx: { opening: (design.opening === 'seal' ? 'envelope' : design.opening) as OpeningName, effect: design.effect as EffectName, effectColor: accent, music: content.musicUrl || '', sealText: given.join(' & ') },
    elements: els,
  })
}
