'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate, type Content, type Design } from '@/lib/types'
import { isPremium } from '@/lib/premium'
import { sanitizeCanvas } from '@/lib/canvas'
import { getCanvasTemplate } from '@/lib/canvasTemplates'
import { slugProblem, toSlug } from '@/lib/slug'

export type RsvpRow = { event?: string; attending: string; guests: number }

/**
 * RSVP from the card's open link: one row per function. Guests with a personal link reply
 * through submitGuestRsvp instead.
 */
export async function submitRsvp(input: { invitationId: string; name: string; message: string; rows?: RsvpRow[]; attending?: string; guests?: number }) {
  const name = String(input.name ?? '').trim().slice(0, 80)
  if (!name || !input.invitationId) return { ok: false }
  const rows = (input.rows?.length ? input.rows : [{ attending: input.attending ?? 'yes', guests: input.guests ?? 1 }]).slice(0, 20)
  const message = String(input.message ?? '').trim().slice(0, 500) || null
  const supabase = await createClient()
  const { error } = await supabase.from('rsvps').insert(rows.map((r) => {
    const attending = ['yes', 'no', 'maybe'].includes(r.attending) ? r.attending : 'yes'
    return {
      invitation_id: input.invitationId, name, message, attending,
      guests: attending === 'no' ? 0 : Math.min(20, Math.max(1, Math.floor(Number(r.guests) || 1))),
      event_name: r.event ? String(r.event).slice(0, 80) : null,
    }
  }))
  return { ok: !error }
}

/** RSVP through a guest's personal link (replying again replaces the earlier reply). */
export async function submitGuestRsvp(input: { slug: string; message: string; rows: RsvpRow[] }) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_guest_rsvp', {
    p_slug: String(input.slug ?? '').slice(0, 80),
    p_rows: (input.rows ?? []).slice(0, 20).map((r) => ({ event: r.event ?? '', attending: r.attending, guests: Number(r.guests) || 1 })),
    p_message: String(input.message ?? '').slice(0, 500),
  })
  return { ok: !error && data === true }
}

function makeSlug(c: Content) {
  const base = `${c.name1} ${c.name2}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return `${base || 'invite'}-${Math.random().toString(36).slice(2, 7)}`
}

export async function createInvitation(formData: FormData) {
  const template = getTemplate(String(formData.get('template') || ''))
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login?next=/templates')
  const { data, error } = await supabase
    .from('invitations')
    // design '{}' = the template's own design (filled in by normalize). Custom designs are Premium.
    .insert({ user_id: auth.user.id, slug: makeSlug(template.content), template: template.id, content: template.content, design: {} })
    .select('id')
    .single()
  if (error || !data) redirect('/dashboard?error=create')
  redirect(`/dashboard/${data.id}`)
}

type SaveResult = { ok: boolean; published: boolean; error?: string }

export async function saveInvitation(id: string, patch: { content: Content; design: Design; published: boolean }): Promise<SaveResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, published: false, error: 'Please sign in again.' }
  const premium = await isPremium(supabase, auth.user.id)
  const { data: row } = await supabase.from('invitations').select('share_paid').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!row) return { ok: false, published: false, error: 'Card not found.' }
  // Publishing (the share link) needs this card to be paid for; the database enforces it too.
  const published = Boolean(patch.published && row.share_paid)
  // Free accounts save details and events only; the database rejects design changes too.
  const update = premium ? { ...patch, published } : { content: patch.content, published }
  const { error } = await supabase.from('invitations').update(update).eq('id', id).eq('user_id', auth.user.id)
  return saveResult(error, published)
}

function saveResult(error: { message: string } | null, published: boolean): SaveResult {
  if (error?.message.includes('premium_required')) return { ok: false, published, error: 'Customising the design needs Premium.' }
  if (error?.message.includes('payment_required')) return { ok: false, published, error: 'Pay for this card to get its share link.' }
  return { ok: !error, published, error: error?.message }
}

export async function deleteInvitation(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('invitations').delete().eq('id', String(formData.get('id')))
  redirect('/dashboard')
}

/** Starts a new drag-and-drop card from a design template (Premium). */
export async function createCanvasInvitation(formData: FormData) {
  const tpl = getCanvasTemplate(String(formData.get('template') || ''))
  if (!tpl) redirect('/#designs')
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login?next=/%23designs')
  if (!(await isPremium(supabase, auth.user.id))) redirect('/premium?from=designer')
  const slug = `${tpl.id}-${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await supabase
    .from('invitations')
    .insert({ user_id: auth.user.id, slug, template: tpl.id, kind: 'canvas', canvas: tpl.doc, content: { eventType: tpl.tag, name1: tpl.name }, design: {} })
    .select('id')
    .single()
  if (error || !data) redirect('/dashboard?error=create')
  redirect(`/design/${data.id}`)
}

/** Saves a drag-and-drop card. The card is re-validated here; the database enforces Premium. */
export async function saveCanvas(id: string, input: { doc: unknown; title: string; published: boolean }): Promise<SaveResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, published: false, error: 'Please sign in again.' }
  if (!(await isPremium(supabase, auth.user.id))) return { ok: false, published: false, error: 'The designer needs Premium.' }
  const { data: row } = await supabase.from('invitations').select('content, share_paid').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!row) return { ok: false, published: false, error: 'Card not found.' }
  const title = String(input.title ?? '').trim().slice(0, 80) || 'My card'
  const published = Boolean(input.published && row.share_paid)
  const { error } = await supabase.from('invitations')
    .update({ canvas: sanitizeCanvas(input.doc), published, content: { ...(row.content ?? {}), name1: title } })
    .eq('id', id).eq('user_id', auth.user.id)
  return saveResult(error, published)
}

/** Sets the name in a card's link (your-site.com/<name>). Must be unique across the site. */
export async function updateSlug(id: string, raw: string): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const slug = toSlug(String(raw ?? ''))
  const problem = slugProblem(slug)
  if (problem) return { ok: false, error: problem }
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  const { data, error } = await supabase.from('invitations').update({ slug }).eq('id', id).eq('user_id', auth.user.id).select('slug').maybeSingle()
  if (error?.code === '23505' || error?.message.includes('duplicate') || error?.message.includes('link_taken')) return { ok: false, error: `"${slug}" is already taken. Try adding something, e.g. ${slug}-wedding.` }
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Card not found.' }
  return { ok: true, slug: data.slug }
}
