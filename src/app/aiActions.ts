'use server'
import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPremium } from '@/lib/premium'
import { designCard, drawImage, type AiDesignResult } from '@/lib/aiDesign'
import { AI_PROVIDERS, aiCost, isAiProvider, type AiKind, type AiProvider } from '@/lib/aiProviders'
import { logError } from '@/lib/errors'

/** A safety cap on AI requests per account per day, on top of credits. */
const DAILY_LIMIT = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 40)

type Charged = { ok: true; supabase: SupabaseClient; userId: string; generationId: number; eventType?: string; left: number } | { ok: false; error: string }

/** Reference pictures must be in the signed-in person's own folder of our photo storage. */
function ownUpload(url: string, userId: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  return Boolean(base) && url.startsWith(`${base}/storage/v1/object/public/photos/${userId}/`) && url.length < 2000
}

/** Checks the card and the person, then takes the AI credits (the database refuses if there are not enough). */
async function charge(invitationId: string, provider: AiProvider, kind: AiKind): Promise<Charged> {
  const cost = aiCost(provider, kind)
  if (cost === null) return { ok: false, error: `${AI_PROVIDERS[provider].name} cannot draw pictures. Pick GPT or Gemini.` }
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  const { data: card } = await supabase.from('invitations').select('id, content').eq('id', invitationId).eq('user_id', auth.user.id).maybeSingle()
  if (!card) return { ok: false, error: 'Card not found.' }
  if (!(await isPremium(supabase, auth.user.id))) return { ok: false, error: 'The designer needs Premium.' }
  const { count } = await supabase.from('ai_generations').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString())
  if ((count ?? 0) >= DAILY_LIMIT) return { ok: false, error: `You have made ${DAILY_LIMIT} AI requests today. Please try again tomorrow.` }
  const { data: id, error } = await supabase.rpc('use_ai_credits', { p_credits: cost, p_kind: kind, p_provider: provider })
  if (error?.message.includes('not_enough_ai_credits')) return { ok: false, error: `This needs ${cost} AI credit${cost === 1 ? '' : 's'}. Buy AI credits to continue.` }
  if (error || !id) return { ok: false, error: 'Could not start the AI. Check that supabase/schema.sql has been run.' }
  const { data: profile } = await supabase.from('profiles').select('ai_credits').eq('user_id', auth.user.id).maybeSingle()
  const eventType = String((card.content as { eventType?: string } | null)?.eventType ?? '') || undefined
  return { ok: true, supabase, userId: auth.user.id, generationId: Number(id), eventType, left: Math.max(0, Number(profile?.ai_credits ?? 0)) }
}

/** The AI failed: give the credits back (server only). */
async function refund(generationId: number, cost: number, left: number) {
  try {
    const { data } = await createAdminClient().rpc('refund_ai_credits', { p_generation_id: generationId })
    return data === true ? left + cost : left
  } catch { return left }
}

/** AI credits left, for the designer's AI tab. */
export async function aiCreditsLeft(): Promise<number> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return 0
  const { data } = await supabase.from('profiles').select('ai_credits').eq('user_id', auth.user.id).maybeSingle()
  return Math.max(0, Number(data?.ai_credits ?? 0))
}

/** Designs a card from a reference picture and/or a description. The designer shows it; the host saves. */
export async function generateAiDesign(invitationId: string, input: { provider: string; prompt: string; imageUrl?: string }): Promise<AiDesignResult & { credits?: number }> {
  if (!isAiProvider(input.provider)) return { ok: false, error: 'Pick an AI first.' }
  const provider = input.provider
  const prompt = String(input.prompt ?? '').slice(0, 2000)
  const imageUrl = input.imageUrl ? String(input.imageUrl) : undefined
  if (!imageUrl && prompt.trim().length < 10) return { ok: false, error: 'Upload a picture of a design you like, or describe the card you want.' }
  const paid = await charge(invitationId, provider, 'design')
  if (!paid.ok) return paid
  if (imageUrl && !ownUpload(imageUrl, paid.userId)) return { ok: false, error: 'Please upload the picture again.', credits: await refund(paid.generationId, aiCost(provider, 'design')!, paid.left) }
  try {
    const res = await designCard({ provider, prompt, imageUrl, eventType: paid.eventType })
    if (!res.ok) return { ...res, credits: await refund(paid.generationId, aiCost(provider, 'design')!, paid.left) }
    return { ...res, credits: paid.left }
  } catch (e) {
    await logError('ai-design', e, `/design/${invitationId}`, undefined, paid.userId)
    return { ok: false, error: 'The AI had a problem. Your credits were given back. Please try again.', credits: await refund(paid.generationId, aiCost(provider, 'design')!, paid.left) }
  }
}

/**
 * Draws a picture with GPT or Gemini and saves it in the host's photo folder.
 * `use`: 'background' = a tall card background; 'picture' = a square picture to place on the card.
 */
export async function generateAiImage(invitationId: string, input: { provider: string; prompt: string; use: 'background' | 'picture' }): Promise<{ ok: true; url: string; credits: number } | { ok: false; error: string; credits?: number }> {
  if (!isAiProvider(input.provider)) return { ok: false, error: 'Pick an AI first.' }
  const provider = input.provider
  if (provider === 'claude') return { ok: false, error: 'Claude cannot draw pictures. Pick GPT or Gemini.' }
  const prompt = String(input.prompt ?? '').trim().slice(0, 1000)
  if (prompt.length < 5) return { ok: false, error: 'Describe the picture you want, e.g. "gold and maroon floral frame with roses".' }
  const paid = await charge(invitationId, provider, 'image')
  if (!paid.ok) return paid
  const cost = aiCost(provider, 'image')!
  try {
    const res = await drawImage({ provider, prompt, tall: input.use === 'background' })
    if (!res.ok) return { ...res, credits: await refund(paid.generationId, cost, paid.left) }
    // Smaller WebP so cards open fast on phones.
    const webp = await sharp(res.data).resize({ width: 1200, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer()
    const path = `${paid.userId}/ai-${invitationId}-${Date.now()}.webp`
    const admin = createAdminClient()
    const { error } = await admin.storage.from('photos').upload(path, webp, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
    if (error) throw new Error(`Upload failed: ${error.message}`)
    return { ok: true, url: admin.storage.from('photos').getPublicUrl(path).data.publicUrl, credits: paid.left }
  } catch (e) {
    await logError('ai-image', e, `/design/${invitationId}`, undefined, paid.userId)
    return { ok: false, error: 'The AI picture could not be made. Your credits were given back. Please try again.', credits: await refund(paid.generationId, cost, paid.left) }
  }
}
