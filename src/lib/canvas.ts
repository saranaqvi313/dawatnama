/**
 * Drag-and-drop card model. A card is a 360 × 640 design surface (phone shaped) holding
 * positioned elements. Coordinates are in design units; cards scale to any screen.
 */

export const CW = 360
export const CH = 640

export const CANVAS_FONTS = {
  playfair: { label: 'Playfair Display', css: "'Playfair Display', serif" },
  cormorant: { label: 'Cormorant Garamond', css: "'Cormorant Garamond', serif" },
  greatvibes: { label: 'Great Vibes (script)', css: "'Great Vibes', cursive" },
  poppins: { label: 'Poppins', css: "'Poppins', sans-serif" },
} as const
export type FontKey = keyof typeof CANVAS_FONTS

export const ORNAMENTS = ['mandala', 'divider', 'corner', 'lantern', 'crescent', 'leaf', 'flower', 'star'] as const
export type OrnamentName = (typeof ORNAMENTS)[number]
export const SHAPES = ['rect', 'circle', 'line', 'arch'] as const
export type ShapeName = (typeof SHAPES)[number]
export const PATTERNS = ['none', 'geometric', 'floral', 'arches', 'dots'] as const
export type PatternName = (typeof PATTERNS)[number]

type Base = { id: string; x: number; y: number; w: number; h: number; rotate: number; opacity: number; locked: boolean }
export type TextEl = Base & {
  type: 'text'; text: string; font: FontKey; size: number; color: string; weight: 400 | 500 | 600 | 700
  italic: boolean; align: 'left' | 'center' | 'right'; spacing: number; lineHeight: number; upper: boolean
}
export type ImageEl = Base & { type: 'image'; src: string; radius: number; fit: 'cover' | 'contain'; border: number; borderColor: string }
export type ShapeEl = Base & { type: 'shape'; shape: ShapeName; fill: string; stroke: string; strokeWidth: number; radius: number }
export type OrnamentEl = Base & { type: 'ornament'; name: OrnamentName; color: string }
export type CanvasEl = TextEl | ImageEl | ShapeEl | OrnamentEl

export type CanvasBg = { color: string; color2: string; gradient: boolean; pattern: PatternName; patternColor: string; image: string }
export type CanvasDoc = { v: 1; bg: CanvasBg; elements: CanvasEl[] }

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

const safeId = (v: unknown, i: number) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : `el${i}`)

function sanitizeEl(raw: Record<string, unknown>, i: number): CanvasEl | null {
  const base: Base = {
    id: safeId(raw.id, i),
    x: num(raw.x, -CW, CW * 2, 40), y: num(raw.y, -CH, CH * 2, 40),
    w: num(raw.w, 1, CW * 3, 120), h: num(raw.h, 1, CH * 3, 40),
    rotate: num(raw.rotate, -360, 360, 0), opacity: num(raw.opacity, 0, 1, 1), locked: bool(raw.locked),
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
      }
    case 'image':
      return {
        ...base, type: 'image', src: safeImageUrl(raw.src), radius: num(raw.radius, 0, 50, 0),
        fit: oneOf(raw.fit, ['cover', 'contain'] as const, 'cover'), border: num(raw.border, 0, 20, 0), borderColor: color(raw.borderColor, '#ffffff'),
      }
    case 'shape':
      return {
        ...base, type: 'shape', shape: oneOf(raw.shape, SHAPES, 'rect'), fill: color(raw.fill, 'transparent'),
        stroke: color(raw.stroke, '#000000'), strokeWidth: num(raw.strokeWidth, 0, 30, 1), radius: num(raw.radius, 0, 200, 0),
      }
    case 'ornament':
      return { ...base, type: 'ornament', name: oneOf(raw.name, ORNAMENTS, 'divider'), color: color(raw.color, '#b8892b') }
    default:
      return null
  }
}

export function sanitizeCanvas(input: unknown): CanvasDoc {
  const doc = (input && typeof input === 'object' ? input : {}) as { bg?: Record<string, unknown>; elements?: unknown }
  const bg = doc.bg ?? {}
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
    bg: {
      color: color(bg.color, '#fbf6ea'), color2: color(bg.color2, '#f1eada'), gradient: bool(bg.gradient),
      pattern: oneOf(bg.pattern, PATTERNS, 'none'), patternColor: color(bg.patternColor, '#b8892b'), image: safeImageUrl(bg.image),
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
  ({ id: newId(), x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h, rotate: 0, opacity: 1, locked: false })

export type AddKind = 'heading' | 'text' | 'script' | 'image' | `shape:${ShapeName}` | `ornament:${OrnamentName}`

export function createElement(kind: AddKind, at?: { x: number; y: number }, accent = '#b8892b', ink = '#2b2b2b'): CanvasEl {
  const cx = at?.x ?? CW / 2
  const cy = at?.y ?? CH / 2
  if (kind === 'heading')
    return { ...base(280, 50, cx, cy), type: 'text', text: 'Your heading', font: 'playfair', size: 32, color: ink, weight: 600, italic: false, align: 'center', spacing: 0, lineHeight: 1.15, upper: false }
  if (kind === 'script')
    return { ...base(300, 70, cx, cy), type: 'text', text: 'Bride & Groom', font: 'greatvibes', size: 44, color: accent, weight: 400, italic: false, align: 'center', spacing: 0, lineHeight: 1.1, upper: false }
  if (kind === 'text')
    return { ...base(260, 60, cx, cy), type: 'text', text: 'Add your text here', font: 'poppins', size: 14, color: ink, weight: 400, italic: false, align: 'center', spacing: 0, lineHeight: 1.5, upper: false }
  if (kind === 'image')
    return { ...base(160, 160, cx, cy), type: 'image', src: '', radius: 50, fit: 'cover', border: 3, borderColor: accent }
  if (kind.startsWith('shape:')) {
    const shape = kind.slice(6) as ShapeName
    const dims: Record<ShapeName, [number, number]> = { rect: [200, 120], circle: [140, 140], line: [220, 2], arch: [260, 360] }
    const [w, h] = dims[shape]
    return { ...base(w, h, cx, cy), type: 'shape', shape, fill: 'transparent', stroke: accent, strokeWidth: shape === 'line' ? 2 : 1.5, radius: 0 }
  }
  const name = kind.slice(9) as OrnamentName
  const dims: Partial<Record<OrnamentName, [number, number]>> = { divider: [220, 40], corner: [90, 90], lantern: [60, 120] }
  const [w, h] = dims[name] ?? [110, 110]
  return { ...base(w, h, cx, cy), type: 'ornament', name, color: accent }
}

export function emptyCanvas(): CanvasDoc {
  return { v: 1, bg: { color: '#fbf6ea', color2: '#f1eada', gradient: false, pattern: 'none', patternColor: '#b8892b', image: '' }, elements: [] }
}
