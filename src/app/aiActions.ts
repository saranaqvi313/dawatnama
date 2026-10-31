'use server'
import { createClient } from '@/lib/supabase/server'
import { isPremium } from '@/lib/premium'
import { designCard, type AiDesignResult } from '@/lib/aiDesign'

/** AI designs per account per day (each one is a paid Claude request). */
const DAILY_LIMIT = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 20)

/** Reference pictures must be in the signed-in person's own folder of our photo storage. */
function ownUpload(url: string, userId: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  return Boolean(base) && url.startsWith(`${base}/storage/v1/object/public/photos/${userId}/`) && url.length < 2000
}

/** Designs a card with AI from a reference picture and/or a description. The designer shows it and the host saves. */
export async function generateAiDesign(invitationId: string, input: { prompt: string; imageUrl?: string }): Promise<AiDesignResult & { left?: number }> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  const { data: card } = await supabase.from('invitations').select('id, content').eq('id', invitationId).eq('user_id', auth.user.id).maybeSingle()
  if (!card) return { ok: false, error: 'Card not found.' }
  if (!(await isPremium(supabase, auth.user.id))) return { ok: false, error: 'The designer needs Premium.' }

  const prompt = String(input.prompt ?? '').slice(0, 2000)
  const imageUrl = input.imageUrl ? String(input.imageUrl) : undefined
  if (imageUrl && !ownUpload(imageUrl, auth.user.id)) return { ok: false, error: 'Please upload the picture again.' }
  if (!imageUrl && prompt.trim().length < 10) return { ok: false, error: 'Upload a picture of a design you like, or describe the card you want.' }

  const since = new Date(Date.now() - 86400000).toISOString()
  const { count } = await supabase.from('ai_generations').select('id', { count: 'exact', head: true }).gte('created_at', since)
  const used = count ?? 0
  if (used >= DAILY_LIMIT) return { ok: false, error: `You have used all ${DAILY_LIMIT} AI designs for today. Please try again tomorrow.` }
  const { error } = await supabase.from('ai_generations').insert({ user_id: auth.user.id })
  if (error) return { ok: false, error: 'Could not start the AI designer. Check that supabase/schema.sql has been run.' }

  const eventType = String((card.content as { eventType?: string } | null)?.eventType ?? '') || undefined
  const res = await designCard({ prompt, imageUrl, eventType })
  return { ...res, left: DAILY_LIMIT - used - 1 }
}
