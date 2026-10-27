'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/identity'
import { FREE_MODE } from '@/lib/pricing'
import { slugProblem, toSlug, RESERVED_SLUGS } from '@/lib/slug'

export type GuestInput = { name: string; phone?: string; party_size?: number; events?: string[] }
type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

async function owner(invitationId: string) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { supabase, user: null, card: null }
  const { data: card } = await supabase.from('invitations').select('id').eq('id', invitationId).eq('user_id', auth.user.id).maybeSingle()
  return { supabase, user: auth.user, card }
}

function cleanGuest(g: GuestInput) {
  const name = String(g.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
  const phone = g.phone ? normalizePhone(String(g.phone)) : null
  const party = Math.min(50, Math.max(1, Math.round(Number(g.party_size) || 1)))
  const events = Array.isArray(g.events) ? g.events.map((e) => String(e).trim().slice(0, 80)).filter(Boolean).slice(0, 20) : []
  return { name, phone, party_size: party, events }
}

/** Adds guests (typed in or uploaded). Each gets a link name made from their name. */
export async function addGuests(invitationId: string, input: GuestInput[]): Promise<Result<{ added: number }>> {
  const rows = input.map(cleanGuest).filter((g) => g.name).slice(0, 500)
  if (!rows.length) return { ok: false, error: 'Add at least one guest name.' }
  const { supabase, user, card } = await owner(invitationId)
  if (!user) return { ok: false, error: 'Please sign in again.' }
  if (!card) return { ok: false, error: 'Card not found.' }
  const wanted = rows.map((g) => {
    let s = toSlug(g.name)
    if (s.length < 3) s = `guest-${s || Math.random().toString(36).slice(2, 6)}`
    if (RESERVED_SLUGS.has(s)) s = `${s}-guest`
    return s
  })
  const { data: slugs, error: slugErr } = await supabase.rpc('free_link_names', { p_names: wanted })
  if (slugErr || !Array.isArray(slugs)) return { ok: false, error: 'Could not prepare guest links. Check that supabase/schema.sql has been run.' }
  const { error } = await supabase.from('guests').insert(rows.map((g, i) => ({ ...g, invitation_id: invitationId, user_id: user.id, slug: slugs[i] })))
  if (error) return { ok: false, error: error.message.includes('link_taken') ? 'A link name was taken at the same moment. Please try again.' : error.message }
  revalidatePath(`/dashboard/${invitationId}/guests`)
  return { ok: true, data: { added: rows.length } }
}

export async function updateGuest(id: string, patch: GuestInput & { slug?: string }): Promise<Result> {
  const supabase = await createClient()
  const g = cleanGuest(patch)
  if (!g.name) return { ok: false, error: 'The guest needs a name.' }
  const update: Record<string, unknown> = { ...g }
  if (patch.slug !== undefined) {
    const slug = toSlug(patch.slug)
    const problem = slugProblem(slug)
    if (problem) return { ok: false, error: problem }
    update.slug = slug
  }
  const { error } = await supabase.from('guests').update(update).eq('id', id)
  if (error?.message.includes('link_taken') || error?.code === '23505') return { ok: false, error: 'That link name is already taken. Try another.' }
  if (error?.message.includes('link_locked')) return { ok: false, error: 'A live link cannot be renamed.' }
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function deleteGuests(ids: string[]): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from('guests').delete().in('id', ids.slice(0, 500))
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Makes guest links live, one credit each. */
export async function activateGuests(ids: string[]): Promise<Result<{ used: number }>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('activate_guest_links', { p_guest_ids: ids.slice(0, 500) })
  if (error?.message.includes('not_enough_credits')) return { ok: false, error: FREE_MODE ? 'The database is still in paid mode. Run supabase/free_mode.sql in Supabase (SQL editor) once.' : 'Not enough guest links. Buy more to make these live.' }
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { used: Number(data) || 0 } }
}

/** Unlocks the card's open link with one credit. */
export async function activateCardLink(invitationId: string): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('activate_card_link', { p_invitation_id: invitationId })
  if (error?.message.includes('not_enough_credits')) return { ok: false, error: FREE_MODE ? 'The database is still in paid mode. Run supabase/free_mode.sql in Supabase (SQL editor) once.' : 'You have no guest links left. Buy a link to unlock this card.' }
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function markReminded(ids: string[]): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from('guests').update({ reminded_at: new Date().toISOString() }).in('id', ids.slice(0, 500))
  return error ? { ok: false, error: error.message } : { ok: true }
}
