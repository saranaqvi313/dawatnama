/**
 * AI card designer: Claude, GPT or Gemini looks at a reference design (a screenshot from Pinterest, Canva…) and the
 * host's description, and lays out a card for the drag-and-drop designer. Server-only (uses the API keys).
 */
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { AI_PROVIDERS, type AiProvider } from './aiProviders'
import {
  ANIMS, CANVAS_FONTS, CH, CW, EFFECTS, MASKS, MAX_ELEMENTS, MAX_H, MIN_H, OPENINGS, ORNAMENTS, PATTERNS, SCENE_LABEL, SCENE_NAMES, SHAPES,
  sanitizeCanvas, type CanvasDoc, type FontKey,
} from './canvas'

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

/** Models, changeable without a code change. Defaults are each company's current models. */
export const AI_MODELS = {
  claude: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
  gpt: process.env.OPENAI_MODEL || 'gpt-6-luna',
  gemini: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
}
const KEYS: Record<AiProvider, string> = { claude: 'ANTHROPIC_API_KEY', gpt: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY' }

/** Which models this site has keys for (shown as choices in the designer). */
export const aiConfigured = (): Record<AiProvider, boolean> => ({
  claude: Boolean(process.env.ANTHROPIC_API_KEY), gpt: Boolean(process.env.OPENAI_API_KEY), gemini: Boolean(process.env.GEMINI_API_KEY),
})

let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null
let geminiClient: GoogleGenAI | null = null
const anthropic = () => (anthropicClient ??= new Anthropic())
const openai = () => (openaiClient ??= new OpenAI())
const gemini = () => (geminiClient ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }))

export type AiDesignResult = { ok: true; doc: CanvasDoc; title: string; summary: string } | { ok: false; error: string }
type Ask = { text: string; imageUrl?: string }
type Answer = { card: z.infer<typeof AiCard> | null; problem?: string }

const READ_FAILED = 'The AI answer could not be read. Please try again.'

/** Claude (Anthropic): structured output checked by the SDK against the schema. */
async function askClaude({ text, imageUrl }: Ask): Promise<Answer> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...(imageUrl ? [{ type: 'image' as const, source: { type: 'url' as const, url: imageUrl } }] : []),
    { type: 'text', text },
  ]
  const response = await anthropic().beta.messages.parse({
    model: AI_MODELS.claude,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(AiCard) },
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  })
  if (response.stop_reason === 'refusal') return { card: null, problem: 'The AI could not make a card from this picture. Try another picture or describe the card in words.' }
  if (response.stop_reason === 'max_tokens') return { card: null, problem: 'The design came out too long. Try a simpler description.' }
  return { card: response.parsed_output ?? null }
}

/** GPT (OpenAI Responses API): strict JSON schema output. */
async function askGpt({ text, imageUrl }: Ask): Promise<Answer> {
  const response = await openai().responses.parse({
    model: AI_MODELS.gpt,
    instructions: SYSTEM,
    input: [{ role: 'user', content: [
      ...(imageUrl ? [{ type: 'input_image' as const, image_url: imageUrl, detail: 'high' as const }] : []),
      { type: 'input_text' as const, text },
    ] }],
    text: { format: zodTextFormat(AiCard, 'invitation_card') },
  })
  if (response.status === 'incomplete') return { card: null, problem: 'The design came out too long. Try a simpler description.' }
  return { card: response.output_parsed ?? null }
}

/** Gemini (Google): JSON output with the same schema; the picture is sent inline. */
async function askGemini({ text, imageUrl }: Ask): Promise<Answer> {
  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = []
  if (imageUrl) {
    const res = await fetch(imageUrl)
    if (!res.ok) return { card: null, problem: 'Could not read the picture. Please upload it again.' }
    const mimeType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0]
    parts.push({ inlineData: { mimeType, data: Buffer.from(await res.arrayBuffer()).toString('base64') } })
  }
  parts.push({ text })
  const response = await gemini().models.generateContent({
    model: AI_MODELS.gemini,
    contents: [{ role: 'user', parts }],
    config: { systemInstruction: SYSTEM, responseMimeType: 'application/json', responseJsonSchema: z.toJSONSchema(AiCard) },
  })
  try {
    const parsed = AiCard.safeParse(JSON.parse(response.text ?? ''))
    return { card: parsed.success ? parsed.data : null }
  } catch { return { card: null } }
}

const ASK: Record<AiProvider, (a: Ask) => Promise<Answer>> = { claude: askClaude, gpt: askGpt, gemini: askGemini }

/** The provider's own error, turned into a message for the host (nothing secret, no stack). */
function friendlyError(e: unknown): string | null {
  const status = (e as { status?: number })?.status
  if (status === 429) return 'This AI is busy right now. Please try again in a minute or pick another AI.'
  if (status === 400) return 'The AI could not open this picture. Try a JPG or PNG under 5 MB.'
  if (status === 401 || status === 403) return 'This AI is not set up correctly on the site. Please pick another AI.'
  if (e instanceof Anthropic.APIError || e instanceof OpenAI.APIError || typeof status === 'number') return `The AI had a problem (${status ?? 'network'}). Please try again.`
  return null
}

/** Asks the chosen AI for a card. `imageUrl` is a reference picture already uploaded to our storage. */
export async function designCard({ provider, prompt, imageUrl, eventType }: { provider: AiProvider; prompt: string; imageUrl?: string; eventType?: string }): Promise<AiDesignResult> {
  if (!aiConfigured()[provider]) return { ok: false, error: `${AI_PROVIDERS[provider].name} is not set up on this site yet (${KEYS[provider]} is missing).` }
  const text = [
    eventType ? `Event: ${eventType}.` : '',
    prompt.trim() ? `What the host wants:\n${prompt.trim()}` : 'The host did not write anything; design a beautiful card in the style of the picture with placeholders.',
    imageUrl ? 'The attached picture is the design they want the card to look like.' : 'There is no reference picture; design it from the description.',
  ].filter(Boolean).join('\n\n')
  try {
    const { card: out, problem } = await ASK[provider]({ text, imageUrl })
    if (!out) return { ok: false, error: problem ?? READ_FAILED }
    const doc = sanitizeCanvas({
      v: 1, h: out.h,
      bg: { ...out.bg, image: '', imageOpacity: 1 },
      fx: { ...out.fx, music: '' },
      elements: out.elements.map((e, i) => ({ ...e, id: `ai${i}`, locked: false, link: '', ...(e.type === 'image' ? { src: '', fit: 'cover', filter: 'none' } : {}) })),
    })
    if (!doc.elements.length) return { ok: false, error: 'The AI did not place anything on the card. Please try again.' }
    return { ok: true, doc, title: out.title.slice(0, 80), summary: out.summary.slice(0, 300) }
  } catch (e) {
    const message = friendlyError(e)
    if (message) return { ok: false, error: message }
    throw e
  }
}

// ---------------------------------------------------------------------------------------
// AI pictures: background art, floral frames, illustrations. GPT and Gemini draw; Claude does not.
// ---------------------------------------------------------------------------------------
export const AI_IMAGE_MODELS = {
  gpt: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare',
  gemini: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
}

const IMAGE_STYLE = `This picture is for a digital invitation card (Pakistani celebrations such as nikah, mehndi, walima, Eid, birthdays).
Make it elegant and print-quality. Do not write any words, letters, names or numbers in the picture; the card adds its own text.
No logos or watermarks. Do not show real, identifiable people.`

export type AiImageResult = { ok: true; data: Buffer; mimeType: string } | { ok: false; error: string }

/** Draws a picture with GPT or Gemini. `tall` = a portrait card background; otherwise a square picture. */
export async function drawImage({ provider, prompt, tall }: { provider: Exclude<AiProvider, 'claude'>; prompt: string; tall: boolean }): Promise<AiImageResult> {
  if (!aiConfigured()[provider]) return { ok: false, error: `${AI_PROVIDERS[provider].name} is not set up on this site yet (${KEYS[provider]} is missing).` }
  const full = `${IMAGE_STYLE}\n\n${tall ? 'Portrait (tall) full-card background, with calm space in the middle for text.' : 'A single decorative picture, centred.'}\n\nThe host wants: ${prompt.trim()}`
  try {
    if (provider === 'gpt') {
      const res = await openai().images.generate({ model: AI_IMAGE_MODELS.gpt, prompt: full, size: tall ? '1024x1536' : '1024x1024', quality: 'medium', n: 1 })
      const b64 = res.data?.[0]?.b64_json
      return b64 ? { ok: true, data: Buffer.from(b64, 'base64'), mimeType: 'image/png' } : { ok: false, error: 'The AI did not return a picture. Please try again.' }
    }
    const res = await gemini().models.generateContent({
      model: AI_IMAGE_MODELS.gemini,
      contents: [{ role: 'user', parts: [{ text: full }] }],
      config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: tall ? '9:16' : '1:1' } },
    })
    const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
    return part?.inlineData?.data
      ? { ok: true, data: Buffer.from(part.inlineData.data, 'base64'), mimeType: part.inlineData.mimeType || 'image/png' }
      : { ok: false, error: 'The AI could not draw this. Try describing it differently.' }
  } catch (e) {
    const message = friendlyError(e)
    if (message) return { ok: false, error: message }
    throw e
  }
}
