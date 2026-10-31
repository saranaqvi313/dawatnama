/**
 * AI card designer: Claude looks at a reference design (a screenshot from Pinterest, Canva…) and the
 * host's description, and lays out a card for the drag-and-drop designer. Server-only (uses ANTHROPIC_API_KEY).
 */
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import {
  ANIMS, CANVAS_FONTS, CH, CW, EFFECTS, MASKS, MAX_ELEMENTS, MAX_H, MIN_H, OPENINGS, ORNAMENTS, PATTERNS, SCENE_LABEL, SCENE_NAMES, SHAPES,
  sanitizeCanvas, type CanvasDoc, type FontKey,
} from './canvas'

export const AI_MODEL = 'claude-opus-5-5'

const FONT_KEYS = Object.keys(CANVAS_FONTS) as [FontKey, ...FontKey[]]
const hex = z.string().describe('Hex colour such as #d4af37, or "transparent"')
const box = {
  x: z.number(), y: z.number(), w: z.number(), h: z.number(),
  rotate: z.number().describe('Degrees, usually 0'),
  opacity: z.number().describe('0 to 1'),
  anim: z.enum(ANIMS).describe('Entrance or loop animation; "none" for most decorations'),
  delay: z.number().describe('Seconds after the card opens, 0 to 3'),
}
const TextEl = z.object({
  type: z.literal('text'), ...box,
  text: z.string().describe('Use \\n for line breaks'),
  font: z.enum(FONT_KEYS), size: z.number().describe('Font size in design units, 8 to 90'), color: hex,
  weight: z.number().describe('400, 500, 600 or 700'), italic: z.boolean(), align: z.enum(['left', 'center', 'right']),
  spacing: z.number().describe('Letter spacing, -2 to 12'), lineHeight: z.number().describe('0.9 to 2'), upper: z.boolean(),
  foil: z.boolean().describe('Animated gold-foil sheen on the letters'), shadow: z.boolean(), bg: hex, underline: z.boolean(),
})
const ImageEl = z.object({
  type: z.literal('image'), ...box,
  radius: z.number().describe('Corner rounding 0 to 50 (50 = fully round)'), mask: z.enum(MASKS), border: z.number(), borderColor: hex, shadow: z.boolean(),
})
const ShapeEl = z.object({ type: z.literal('shape'), ...box, shape: z.enum(SHAPES), fill: hex, stroke: hex, strokeWidth: z.number(), radius: z.number(), shadow: z.boolean() })
const OrnamentEl = z.object({ type: z.literal('ornament'), ...box, name: z.enum(ORNAMENTS), color: hex })
const SceneEl = z.object({ type: z.literal('scene'), ...box, name: z.enum(SCENE_NAMES), color: hex })

const AiCard = z.object({
  title: z.string().describe('Short card name for the host, e.g. "Ayesha & Hamza Nikah"'),
  summary: z.string().describe('One sentence to the host about what you designed and what to fill in'),
  h: z.number().describe(`Card height, ${MIN_H} to ${MAX_H}; ${CH} fits one phone screen`),
  bg: z.object({ color: hex, color2: hex, gradient: z.boolean(), pattern: z.enum(PATTERNS), patternColor: hex }),
  fx: z.object({ opening: z.enum(OPENINGS), effect: z.enum(EFFECTS), effectColor: hex, sealText: z.string() }),
  elements: z.array(z.discriminatedUnion('type', [TextEl, ImageEl, ShapeEl, OrnamentEl, SceneEl])).describe('Back to front: the first element is drawn at the back'),
})

const SYSTEM = `You design digital invitation cards for Dawatnama, a Pakistani invitation site (nikah, baraat, walima, mehndi, birthdays, Eid parties, aqeeqa and more).
You lay the card out for a drag-and-drop designer, so your answer is the card's elements, not an image.

The card surface:
- ${CW} units wide. Height h is ${CH} for one phone screen, up to ${MAX_H} for a long card that scrolls. x/y is each element's top-left corner, w/h its size, all in these units.
- Elements are drawn in order: first = back. Keep everything that matters inside 0..${CW} horizontally with about 20 units of margin. At most ${MAX_ELEMENTS} elements; 8 to 30 is typical.
- Fonts: ${Object.entries(CANVAS_FONTS).map(([k, f]) => `${k} (${f.label})`).join(', ')}. Script fonts suit names; serif or caps fonts suit headings; poppins suits small details.
- Text boxes must be big enough: roughly size × 0.55 per character in width for each line, and size × lineHeight × lines in height.
- Ornaments (drawn line art in one colour): ${ORNAMENTS.join(', ')}. Shapes: ${SHAPES.join(', ')} ("arch" is a tall mehrab frame).
- Scenes are full illustrations, usually placed full-size (x 0, y 0, w ${CW}, h ${CH}) at the back: ${SCENE_NAMES.map((n) => `${n} (${SCENE_LABEL[n]})`).join(', ')}.
- Image elements are empty photo frames the host fills in later (a couple's photo, a baby photo). Use them where the reference has a photo.
- Background: a colour, an optional gradient to a second colour, an optional pattern. Card magic: how it opens and what floats over it.

How to work:
- If there is a reference picture, match its layout, colour palette, mood, typography style and decoration as closely as these building blocks allow. Do not copy logos, watermarks, brand names or the designer's own text; never trace a photo.
- Put the host's real details in the text: names, event, date, time, venue, hosts, message. Where a detail is missing, write a clear placeholder such as "Venue name, City" so the host can see what to change.
- Write in English (or Roman Urdu if the host does). Use Arabic script only if the host writes it themselves.
- Give the main texts gentle entrance animations (rise, fade or blur with small increasing delays); decorations mostly "none" or a slow loop.
- Make sure text is readable on its background (strong contrast) and nothing important overlaps.`

let client: Anthropic | null = null
const anthropic = () => (client ??= new Anthropic())

export type AiDesignResult = { ok: true; doc: CanvasDoc; title: string; summary: string } | { ok: false; error: string }

/** Asks Claude for a card. `imageUrl` is a reference picture already uploaded to our storage. */
export async function designCard({ prompt, imageUrl, eventType }: { prompt: string; imageUrl?: string; eventType?: string }): Promise<AiDesignResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: 'The AI designer is not set up yet (ANTHROPIC_API_KEY is missing on the server).' }
  const ask = [
    eventType ? `Event: ${eventType}.` : '',
    prompt.trim() ? `What the host wants:\n${prompt.trim()}` : 'The host did not write anything; design a beautiful card in the style of the picture with placeholders.',
    imageUrl ? 'The attached picture is the design they want the card to look like.' : 'There is no reference picture; design it from the description.',
  ].filter(Boolean).join('\n\n')
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...(imageUrl ? [{ type: 'image' as const, source: { type: 'url' as const, url: imageUrl } }] : []),
    { type: 'text', text: ask },
  ]
  try {
    const response = await anthropic().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(AiCard) },
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    })
    if (response.stop_reason === 'refusal') return { ok: false, error: 'The AI could not make a card from this picture. Try another picture or describe the card in words.' }
    if (response.stop_reason === 'max_tokens') return { ok: false, error: 'The design came out too long. Try a simpler description.' }
    const out = response.parsed_output
    if (!out) return { ok: false, error: 'The AI answer could not be read. Please try again.' }
    const doc = sanitizeCanvas({
      v: 1, h: out.h,
      bg: { ...out.bg, image: '', imageOpacity: 1 },
      fx: { ...out.fx, music: '' },
      elements: out.elements.map((e, i) => ({ ...e, id: `ai${i}`, locked: false, link: '', ...(e.type === 'image' ? { src: '', fit: 'cover', filter: 'none' } : {}) })),
    })
    if (!doc.elements.length) return { ok: false, error: 'The AI did not place anything on the card. Please try again.' }
    return { ok: true, doc, title: out.title.slice(0, 80), summary: out.summary.slice(0, 300) }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: 'The AI designer is busy. Please try again in a minute.' }
    if (e instanceof Anthropic.BadRequestError) return { ok: false, error: 'The AI could not open this picture. Try a JPG or PNG under 5 MB.' }
    if (e instanceof Anthropic.APIError) return { ok: false, error: `The AI designer had a problem (${e.status ?? 'network'}). Please try again.` }
    throw e
  }
}
