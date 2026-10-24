/** Starting designs for the drag-and-drop designer (shown on the home page). No sample names. */
import { sanitizeCanvas, type CanvasDoc, type CanvasEl } from './canvas'

export type CanvasTemplate = { id: string; name: string; tag: string; doc: CanvasDoc }

let n = 0
const id = () => `t${n++}`
type TextOpts = Partial<Extract<CanvasEl, { type: 'text' }>>
const text = (t: string, x: number, y: number, w: number, h: number, o: TextOpts): CanvasEl =>
  ({ id: id(), type: 'text', text: t, x, y, w, h, rotate: 0, opacity: 1, locked: false, font: 'poppins', size: 14, color: '#222', weight: 400, italic: false, align: 'center', spacing: 0, lineHeight: 1.3, upper: false, ...o }) as CanvasEl
const orn = (name: string, x: number, y: number, w: number, h: number, color: string, extra: Partial<CanvasEl> = {}): CanvasEl =>
  ({ id: id(), type: 'ornament', name, x, y, w, h, color, rotate: 0, opacity: 1, locked: false, ...extra }) as CanvasEl
const shape = (s: string, x: number, y: number, w: number, h: number, o: Record<string, unknown>): CanvasEl =>
  ({ id: id(), type: 'shape', shape: s, x, y, w, h, rotate: 0, opacity: 1, locked: false, fill: 'transparent', stroke: '#000', strokeWidth: 1.5, radius: 0, ...o }) as CanvasEl

const GOLD = '#d4af37'
const IVORY = '#f6efdc'

const shahiNikah: CanvasDoc = sanitizeCanvas({
  v: 1,
  bg: { color: '#0f3b2e', color2: '#082219', gradient: true, pattern: 'geometric', patternColor: GOLD, image: '' },
  elements: [
    shape('arch', 30, 40, 300, 560, { stroke: GOLD, strokeWidth: 1.5, fill: '#0f3b2ecc' }),
    shape('arch', 40, 52, 280, 536, { stroke: GOLD, strokeWidth: 0.8, opacity: 0.6 }),
    orn('mandala', 140, 78, 80, 80, GOLD),
    text('In the name of Allah, the Most Gracious, the Most Merciful', 70, 170, 220, 40, { font: 'cormorant', italic: true, size: 13, color: GOLD }),
    text('Together with their families', 60, 222, 240, 24, { size: 11, color: IVORY, upper: true, spacing: 3 }),
    text('Bride\n&\nGroom', 50, 252, 260, 150, { font: 'greatvibes', size: 46, color: IVORY, lineHeight: 1.05 }),
    orn('divider', 80, 404, 200, 36, GOLD),
    text('request the pleasure of your company at their Nikah', 70, 444, 220, 40, { font: 'cormorant', size: 15, color: IVORY }),
    text('Saturday, 20 December 2026 · 7:00 PM', 50, 494, 260, 22, { size: 12, color: GOLD, weight: 600 }),
    text('Venue name, City', 60, 518, 240, 22, { size: 12, color: IVORY }),
    orn('corner', 14, 14, 70, 70, GOLD),
    orn('corner', 276, 14, 70, 70, GOLD, { rotate: 90 }),
    orn('corner', 14, 556, 70, 70, GOLD, { rotate: -90 }),
    orn('corner', 276, 556, 70, 70, GOLD, { rotate: 180 }),
  ],
})

const mehndiRang: CanvasDoc = sanitizeCanvas({
  v: 1,
  bg: { color: '#ffe9a8', color2: '#ffb36b', gradient: true, pattern: 'floral', patternColor: '#c2456b', image: '' },
  elements: [
    orn('flower', -40, -40, 170, 170, '#c2456b', { opacity: 0.55 }),
    orn('flower', 250, 520, 170, 170, '#c2456b', { opacity: 0.55 }),
    orn('leaf', 230, 20, 110, 110, '#3f7a3a', { rotate: 10 }),
    orn('leaf', 20, 520, 110, 110, '#3f7a3a', { rotate: 190 }),
    shape('circle', 95, 120, 170, 170, { fill: '#fff4dd', stroke: '#c2456b', strokeWidth: 2 }),
    { id: id(), type: 'image', src: '', x: 105, y: 130, w: 150, h: 150, rotate: 0, opacity: 1, locked: false, radius: 50, fit: 'cover', border: 0, borderColor: '#c2456b' },
    text('Mehndi Night', 20, 304, 320, 66, { font: 'greatvibes', size: 46, color: '#8a1f3d', lineHeight: 1.1 }),
    text('Join us for an evening of colour, music and dholki', 60, 376, 240, 46, { font: 'cormorant', size: 16, color: '#5a2333', weight: 600 }),
    orn('divider', 90, 426, 180, 30, '#c2456b'),
    text('Friday · 18 December 2026', 60, 462, 240, 24, { size: 13, color: '#5a2333', weight: 600, upper: true, spacing: 1 }),
    text('8:00 PM onwards', 60, 486, 240, 22, { size: 13, color: '#5a2333' }),
    text('Family residence, City', 60, 510, 240, 22, { size: 13, color: '#5a2333' }),
  ],
})

const walimaNight: CanvasDoc = sanitizeCanvas({
  v: 1,
  bg: { color: '#10152e', color2: '#1d2550', gradient: true, pattern: 'dots', patternColor: '#c9b26b', image: '' },
  elements: [
    shape('line', 70, 0, 1, 70, { stroke: '#c9b26b' }),
    orn('lantern', 50, 60, 40, 80, '#c9b26b'),
    shape('line', 290, 0, 1, 40, { stroke: '#c9b26b' }),
    orn('lantern', 270, 30, 40, 80, '#c9b26b'),
    orn('crescent', 150, 92, 60, 60, '#e8d9a0'),
    text('The Walima Reception', 40, 182, 280, 26, { size: 12, color: '#c9b26b', upper: true, spacing: 4, weight: 500 }),
    text('Bride & Groom', 30, 214, 300, 120, { font: 'playfair', size: 40, color: '#eef0ff', lineHeight: 1.1, weight: 400 }),
    shape('line', 150, 344, 60, 1.5, { stroke: '#c9b26b' }),
    text('With gratitude to Allah, we invite you to celebrate with us', 50, 362, 260, 46, { font: 'cormorant', size: 16, color: '#dfe3ff', italic: true }),
    shape('rect', 50, 424, 260, 110, { stroke: '#c9b26b', strokeWidth: 1, radius: 10, fill: '#ffffff0d' }),
    text('Sunday, 22 December 2026', 60, 438, 240, 24, { size: 14, color: '#eef0ff', weight: 600 }),
    text('7:30 PM', 60, 462, 240, 22, { size: 13, color: '#c9b26b' }),
    text('Venue name, City', 60, 492, 240, 22, { size: 13, color: '#dfe3ff' }),
    orn('star', 160, 566, 40, 40, '#c9b26b'),
  ],
})

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  { id: 'shahi-nikah', name: 'Shahi Nikah', tag: 'Nikah', doc: shahiNikah },
  { id: 'mehndi-rang', name: 'Mehndi Rang', tag: 'Mehndi', doc: mehndiRang },
  { id: 'walima-night', name: 'Walima Night', tag: 'Walima', doc: walimaNight },
]

export const getCanvasTemplate = (templateId: string) => CANVAS_TEMPLATES.find((t) => t.id === templateId)
