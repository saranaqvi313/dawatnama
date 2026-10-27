/**
 * Drag-and-drop card model. A card is a 360-wide design surface (640 tall by default, longer
 * cards scroll like a page) holding positioned elements. Coordinates are in design units;
 * cards scale to any screen.
 */

export const CW = 360
export const CH = 640
export const MIN_H = 640
export const MAX_H = 2560

export const CANVAS_FONTS = {
  playfair: { label: 'Playfair Display', css: "'Playfair Display', serif" },
  cormorant: { label: 'Cormorant Garamond', css: "'Cormorant Garamond', serif" },
  cinzel: { label: 'Cinzel', css: "'Cinzel', serif" },
  marcellus: { label: 'Marcellus', css: "'Marcellus', serif" },
  poppins: { label: 'Poppins', css: "'Poppins', sans-serif" },
  greatvibes: { label: 'Great Vibes (script)', css: "'Great Vibes', cursive" },
  pinyon: { label: 'Pinyon Script', css: "'Pinyon Script', cursive" },
  alexbrush: { label: 'Alex Brush', css: "'Alex Brush', cursive" },
  parisienne: { label: 'Parisienne', css: "'Parisienne', cursive" },
  allura: { label: 'Allura', css: "'Allura', cursive" },
  italianno: { label: 'Italianno', css: "'Italianno', cursive" },
  rouge: { label: 'Rouge Script', css: "'Rouge Script', cursive" },
  monsieur: { label: 'Monsieur La Doulaise', css: "'Monsieur La Doulaise', cursive" },
  petitformal: { label: 'Petit Formal Script', css: "'Petit Formal Script', cursive" },
  tangerine: { label: 'Tangerine', css: "'Tangerine', cursive" },
} as const
export type FontKey = keyof typeof CANVAS_FONTS

export const ORNAMENTS = ['mandala', 'divider', 'corner', 'lantern', 'crescent', 'leaf', 'flower', 'star'] as const
export type OrnamentName = (typeof ORNAMENTS)[number]
export const SHAPES = ['rect', 'circle', 'line', 'arch', 'heart', 'star'] as const
export type ShapeName = (typeof SHAPES)[number]
export const PATTERNS = ['none', 'geometric', 'floral', 'arches', 'dots'] as const
export type PatternName = (typeof PATTERNS)[number]

/** Fairy-tale scenes (drawn by components/dawat/Scene.tsx) that can be placed on a card. */
export const SCENE_NAMES = ['sheesh', 'chandni', 'gulistan', 'qandeel', 'genda', 'castle'] as const
export type SceneName = (typeof SCENE_NAMES)[number]
export const SCENE_LABEL: Record<SceneName, string> = {
  sheesh: 'Sheesh Mahal', chandni: 'Chandni Raat', gulistan: 'Gulistan roses', qandeel: 'Sky lanterns', genda: 'Genda phool', castle: 'Fairy castle',
}

/** How an element enters (once) or moves (always) on the card. */
export const ANIMS = ['none', 'fade', 'rise', 'drop', 'zoom', 'pop', 'slide-left', 'slide-right', 'blur', 'float', 'sway', 'pulse', 'shine', 'spin', 'glow'] as const
export type AnimName = (typeof ANIMS)[number]
export const ANIM_LABEL: Record<AnimName, string> = {
  none: 'None', fade: 'Fade in', rise: 'Rise up', drop: 'Drop in', zoom: 'Zoom in', pop: 'Pop', 'slide-left': 'Slide from left', 'slide-right': 'Slide from right',
  blur: 'Dreamy blur', float: 'Float (loop)', sway: 'Sway (loop)', pulse: 'Pulse (loop)', shine: 'Shimmer (loop)', spin: 'Slow spin (loop)', glow: 'Glow (loop)',
}

/** Card-wide magic: how the card opens and what floats over it. */
export const OPENINGS = ['none', 'gates', 'storybook', 'envelope', 'doors', 'curtain', 'scroll', 'magic', 'fade'] as const
export type OpeningName = (typeof OPENINGS)[number]
export const OPENING_LABEL: Record<OpeningName, string> = {
  none: 'None', gates: 'Palace gates', storybook: 'Storybook', envelope: 'Envelope', doors: 'Doors', curtain: 'Curtain', scroll: 'Royal scroll', magic: 'Magic sparkle', fade: 'Soft fade',
}
export const EFFECTS = ['none', 'sparkles', 'fireflies', 'petals', 'stars', 'hearts'] as const
export type EffectName = (typeof EFFECTS)[number]
export const EFFECT_LABEL: Record<EffectName, string> = { none: 'None', sparkles: 'Gold sparkles', fireflies: 'Fireflies', petals: 'Falling petals', stars: 'Twinkling stars', hearts: 'Rising hearts' }
export const FILTERS = ['none', 'warm', 'cool', 'bw', 'sepia', 'soft', 'vivid'] as const
export type FilterName = (typeof FILTERS)[number]
export const FILTER_CSS: Record<FilterName, string> = {
  none: '', warm: 'sepia(.25) saturate(1.25) hue-rotate(-8deg)', cool: 'saturate(1.1) hue-rotate(12deg) brightness(1.03)', bw: 'grayscale(1)',
  sepia: 'sepia(.8)', soft: 'brightness(1.08) contrast(.9) saturate(.9)', vivid: 'saturate(1.5) contrast(1.08)',
}
export const MASKS = ['none', 'circle', 'arch', 'heart', 'blob'] as const
export type MaskName = (typeof MASKS)[number]

type Base = {
  id: string; x: number; y: number; w: number; h: number; rotate: number; opacity: number; locked: boolean
  /** Animation and when it starts (seconds after the card opens). */
  anim: AnimName; delay: number
  /** Optional link: tapping the element opens it (maps, a website, WhatsApp). */
  link: string
}
export type TextEl = Base & {
  type: 'text'; text: string; font: FontKey; size: number; color: string; weight: 400 | 500 | 600 | 700
  italic: boolean; align: 'left' | 'center' | 'right'; spacing: number; lineHeight: number; upper: boolean
  /** Gold-foil sheen, soft shadow, and a background box behind the text. */
  foil: boolean; shadow: boolean; bg: string; underline: boolean
}
export type ImageEl = Base & {
  type: 'image'; src: string; radius: number; fit: 'cover' | 'contain'; border: number; borderColor: string
  filter: FilterName; mask: MaskName; shadow: boolean
}
export type VideoEl = Base & { type: 'video'; src: string; radius: number; border: number; borderColor: string; autoplay: boolean }
export type ShapeEl = Base & { type: 'shape'; shape: ShapeName; fill: string; stroke: string; strokeWidth: number; radius: number; shadow: boolean }
export type OrnamentEl = Base & { type: 'ornament'; name: OrnamentName; color: string }
export type SceneEl = Base & { type: 'scene'; name: SceneName; color: string }
export type CanvasEl = TextEl | ImageEl | VideoEl | ShapeEl | OrnamentEl | SceneEl

export type CanvasBg = { color: string; color2: string; gradient: boolean; pattern: PatternName; patternColor: string; image: string; imageOpacity: number }
export type CanvasFx = { opening: OpeningName; effect: EffectName; effectColor: string; music: string; sealText: string }
export type CanvasDoc = { v: 1; h: number; bg: CanvasBg; fx: CanvasFx; elements: CanvasEl[] }

export const MAX_ELEMENTS = 80
export const MAX_TEXT = 600

// ---------------------------------------------------------------------------------------
// Validation. Every card loaded from the database or sent by the browser goes through
// sanitizeCanvas, so a hand-crafted request cannot inject unexpected values into styles.
// ---------------------------------------------------------------------------------------
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const num = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt
}
const color = (v: unknown, dflt: string) => (typeof v === 'string' && (HEX.test(v) || v === 'transparent') ? v : dflt)
const oneOf = <T extends string>(v: unknown, list: readonly T[], dflt: T): T => (list.includes(v as T) ? (v as T) : dflt)
const bool = (v: unknown, dflt = false) => (typeof v === 'boolean' ? v : dflt)

/** Only https images (e.g. Supabase Storage) or site-relative paths. */
export function safeImageUrl(v: unknown): string {
  if (typeof v !== 'string' || v.length > 2000) return ''
  if (v.startsWith('/') && !v.startsWith('//')) return v
  try { return new URL(v).protocol === 'https:' ? v : '' } catch { return '' }
}

/** Video: an uploaded file (https) or a YouTube / Vimeo link. */
export function safeVideoUrl(v: unknown): string {
  if (typeof v !== 'string' || v.length > 2000) return ''
  try { return new URL(v.trim()).protocol === 'https:' ? v.trim() : '' } catch { return '' }
}

/** Links on elements: https websites, maps, WhatsApp, phone and email only. */
export function safeLink(v: unknown): string {
  if (typeof v !== 'string' || !v.trim() || v.length > 1000) return ''
  const t = v.trim()
  if (/^(tel:|mailto:)[^\s<>"']+$/i.test(t)) return t
  try { return new URL(t).protocol === 'https:' ? t : '' } catch { return '' }
}

const safeId = (v: unknown, i: number) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : `el${i}`)

function sanitizeEl(raw: Record<string, unknown>, i: number): CanvasEl | null {
  const base: Base = {
    id: safeId(raw.id, i),
    x: num(raw.x, -CW, CW * 2, 40), y: num(raw.y, -MAX_H, MAX_H * 2, 40),
    w: num(raw.w, 1, CW * 3, 120), h: num(raw.h, 1, MAX_H * 2, 40),
    rotate: num(raw.rotate, -360, 360, 0), opacity: num(raw.opacity, 0, 1, 1), locked: bool(raw.locked),
    anim: oneOf(raw.anim, ANIMS, 'none'), delay: num(raw.delay, 0, 10, 0), link: safeLink(raw.link),
  }
  switch (raw.type) {
    case 'text':
      return {
        ...base, type: 'text',
        text: typeof raw.text === 'string' ? raw.text.slice(0, MAX_TEXT) : '',
        font: oneOf(raw.font, Object.keys(CANVAS_FONTS) as FontKey[], 'playfair'),
        size: num(raw.size, 6, 160, 20), color: color(raw.color, '#222222'),
        weight: ([400, 500, 600, 700].includes(Number(raw.weight)) ? Number(raw.weight) : 400) as TextEl['weight'],
        italic: bool(raw.italic), align: oneOf(raw.align, ['left', 'center', 'right'] as const, 'center'),
        spacing: num(raw.spacing, -5, 30, 0), lineHeight: num(raw.lineHeight, 0.7, 3, 1.25), upper: bool(raw.upper),
        foil: bool(raw.foil), shadow: bool(raw.shadow), bg: color(raw.bg, 'transparent'), underline: bool(raw.underline),
      }
    case 'image':
      return {
        ...base, type: 'image', src: safeImageUrl(raw.src), radius: num(raw.radius, 0, 50, 0),
        fit: oneOf(raw.fit, ['cover', 'contain'] as const, 'cover'), border: num(raw.border, 0, 20, 0), borderColor: color(raw.borderColor, '#ffffff'),
        filter: oneOf(raw.filter, FILTERS, 'none'), mask: oneOf(raw.mask, MASKS, 'none'), shadow: bool(raw.shadow),
      }
    case 'video':
      return {
        ...base, type: 'video', src: safeVideoUrl(raw.src), radius: num(raw.radius, 0, 50, 6),
        border: num(raw.border, 0, 20, 0), borderColor: color(raw.borderColor, '#ffffff'), autoplay: bool(raw.autoplay, true),
      }
    case 'scene':
      return { ...base, type: 'scene', name: oneOf(raw.name, SCENE_NAMES, 'sheesh'), color: color(raw.color, '#d4af37') }
    case 'shape':
      return {
        ...base, type: 'shape', shape: oneOf(raw.shape, SHAPES, 'rect'), fill: color(raw.fill, 'transparent'),
        stroke: color(raw.stroke, '#000000'), strokeWidth: num(raw.strokeWidth, 0, 30, 1), radius: num(raw.radius, 0, 200, 0),
        shadow: bool(raw.shadow),
      }
    case 'ornament':
      return { ...base, type: 'ornament', name: oneOf(raw.name, ORNAMENTS, 'divider'), color: color(raw.color, '#b8892b') }
    default:
      return null
  }
}

export function sanitizeCanvas(input: unknown): CanvasDoc {
  const doc = (input && typeof input === 'object' ? input : {}) as { h?: unknown; bg?: Record<string, unknown>; fx?: Record<string, unknown>; elements?: unknown }
  const bg = doc.bg ?? {}
  const fx = doc.fx ?? {}
  const seen = new Set<string>()
  const elements = (Array.isArray(doc.elements) ? doc.elements : [])
    .slice(0, MAX_ELEMENTS)
    .map((e, i) => (e && typeof e === 'object' ? sanitizeEl(e as Record<string, unknown>, i) : null))
    .filter((e): e is CanvasEl => e !== null)
    .map((e, i) => {
      const id = seen.has(e.id) ? `el${i}-${seen.size}` : e.id
      seen.add(id)
      return { ...e, id }
    })
  return {
    v: 1,
    h: Math.round(num(doc.h, MIN_H, MAX_H, CH)),
    bg: {
      color: color(bg.color, '#fbf6ea'), color2: color(bg.color2, '#f1eada'), gradient: bool(bg.gradient),
      pattern: oneOf(bg.pattern, PATTERNS, 'none'), patternColor: color(bg.patternColor, '#b8892b'), image: safeImageUrl(bg.image),
      imageOpacity: num(bg.imageOpacity, 0.05, 1, 1),
    },
    fx: {
      opening: oneOf(fx.opening, OPENINGS, 'none'), effect: oneOf(fx.effect, EFFECTS, 'none'), effectColor: color(fx.effectColor, '#e8c66a'),
      music: safeVideoUrl(fx.music), sealText: typeof fx.sealText === 'string' ? fx.sealText.slice(0, 80) : '',
    },
    elements,
  }
}

// ---------------------------------------------------------------------------------------
// Element factories used by the designer's "Add" panel.
// ---------------------------------------------------------------------------------------
let counter = 0
export const newId = () => `e${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`

const base = (w: number, h: number, cx = CW / 2, cy = CH / 2): Base =>
  ({ id: newId(), x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h, rotate: 0, opacity: 1, locked: false, anim: 'none', delay: 0, link: '' })

export type AddKind = 'heading' | 'text' | 'script' | 'label' | 'date' | 'image' | 'video' | `shape:${ShapeName}` | `ornament:${OrnamentName}` | `scene:${SceneName}`

const textEl = (b: Base, o: Partial<TextEl>): TextEl => ({
  ...b, type: 'text', text: 'Text', font: 'poppins', size: 14, color: '#2b2b2b', weight: 400, italic: false, align: 'center',
  spacing: 0, lineHeight: 1.4, upper: false, foil: false, shadow: false, bg: 'transparent', underline: false, ...o,
})

export function createElement(kind: AddKind, at?: { x: number; y: number }, accent = '#b8892b', ink = '#2b2b2b'): CanvasEl {
  const cx = at?.x ?? CW / 2
  const cy = at?.y ?? CH / 2
  if (kind === 'heading') return textEl(base(280, 50, cx, cy), { text: 'Your heading', font: 'playfair', size: 32, color: ink, weight: 600, lineHeight: 1.15 })
  if (kind === 'script') return textEl(base(300, 70, cx, cy), { text: 'Bride & Groom', font: 'greatvibes', size: 44, color: accent, lineHeight: 1.1, anim: 'rise' })
  if (kind === 'text') return textEl(base(260, 60, cx, cy), { text: 'Add your text here', size: 14, color: ink, lineHeight: 1.5 })
  if (kind === 'label') return textEl(base(240, 24, cx, cy), { text: 'Together with their families', size: 11, color: ink, upper: true, spacing: 3 })
  if (kind === 'date') return textEl(base(260, 50, cx, cy), { text: 'Saturday, 20 December 2026\n7:00 pm · Venue name, City', font: 'cormorant', size: 16, color: ink, weight: 600, lineHeight: 1.4 })
  if (kind === 'image')
    return { ...base(160, 160, cx, cy), type: 'image', src: '', radius: 50, fit: 'cover', border: 3, borderColor: accent, filter: 'none', mask: 'none', shadow: false }
  if (kind === 'video')
    return { ...base(300, 170, cx, cy), type: 'video', src: '', radius: 6, border: 0, borderColor: accent, autoplay: true }
  if (kind.startsWith('scene:'))
    return { ...base(CW, CH, CW / 2, CH / 2), type: 'scene', name: kind.slice(6) as SceneName, color: accent }
  if (kind.startsWith('shape:')) {
    const shape = kind.slice(6) as ShapeName
    const dims: Record<ShapeName, [number, number]> = { rect: [200, 120], circle: [140, 140], line: [220, 2], arch: [260, 360], heart: [120, 110], star: [120, 120] }
    const [w, h] = dims[shape]
    const filled = shape === 'heart' || shape === 'star'
    return { ...base(w, h, cx, cy), type: 'shape', shape, fill: filled ? accent : 'transparent', stroke: accent, strokeWidth: shape === 'line' ? 2 : 1.5, radius: 0, shadow: false }
  }
  const name = kind.slice(9) as OrnamentName
  const dims: Partial<Record<OrnamentName, [number, number]>> = { divider: [220, 40], corner: [90, 90], lantern: [60, 120] }
  const [w, h] = dims[name] ?? [110, 110]
  return { ...base(w, h, cx, cy), type: 'ornament', name, color: accent }
}

export function emptyCanvas(): CanvasDoc {
  return {
    v: 1, h: CH,
    bg: { color: '#fbf6ea', color2: '#f1eada', gradient: false, pattern: 'none', patternColor: '#b8892b', image: '', imageOpacity: 1 },
    fx: { opening: 'none', effect: 'none', effectColor: '#e8c66a', music: '', sealText: '' },
    elements: [],
  }
}
