'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate, type Content, type Design } from '@/lib/types'
import { isPremium } from '@/lib/premium'
import { FREE_MODE } from '@/lib/pricing'
import { emptyCanvas, sanitizeCanvas } from '@/lib/canvas'
import { classicToCanvas } from '@/lib/classicToCanvas'
import { normalize } from '@/lib/types'
import { getCanvasTemplate } from '@/lib/canvasTemplates'
import { slugProblem, toSlug } from '@/lib/slug'
import { renamedEvents } from '@/lib/guestStats'
import { getCategory } from '@/lib/categories'

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
export async function submitGuestRsvp(input: { slug: string; token: string; message: string; rows: RsvpRow[] }) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_guest_rsvp', {
    p_slug: String(input.slug ?? '').slice(0, 80),
    p_token: String(input.token ?? '').slice(0, 32),
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
  const { data: row } = await supabase.from('invitations').select('share_paid, content').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!row) return { ok: false, published: false, error: 'Card not found.' }
  // Publishing (the share link) needs this card to be paid for; the database enforces it too.
  const published = Boolean(patch.published && row.share_paid)
  // Free accounts save details and events only; the database rejects design changes too.
  const update = premium ? { ...patch, published } : { content: patch.content, published }
  const { error } = await supabase.from('invitations').update(update).eq('id', id).eq('user_id', auth.user.id)
  if (!error) {
    const renames = renamedEvents((row.content as Partial<Content> | null)?.events, patch.content.events)
    if (renames.from.length) await supabase.rpc('rename_card_events', { p_invitation_id: id, p_from: renames.from, p_to: renames.to })
  }
  return saveResult(error, published)
}

function saveResult(error: { message: string } | null, published: boolean): SaveResult {
  if (error?.message.includes('premium_required')) return { ok: false, published, error: FREE_MODE ? 'The database is still in paid mode. Run supabase/free_mode.sql in Supabase (SQL editor) once.' : 'Customising the design needs Premium.' }
  if (error?.message.includes('payment_required')) return { ok: false, published, error: 'Pay for this card to get its share link.' }
  return { ok: !error, published, error: error?.message }
}

export async function deleteInvitation(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('invitations').delete().eq('id', String(formData.get('id')))
  redirect('/invitations')
}

/** Deletes several of the signed-in person's cards (RLS limits it to their own). */
export async function deleteInvitations(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const list = (Array.isArray(ids) ? ids : []).map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 200)
  if (!list.length) return { ok: true }
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  const { error } = await supabase.from('invitations').delete().in('id', list).eq('user_id', auth.user.id)
  return { ok: !error, error: error?.message }
}

/** Starts a new drag-and-drop card from a design template (Premium). */
export async function createCanvasInvitation(formData: FormData) {
  const tpl = getCanvasTemplate(String(formData.get('template') || ''))
  if (!tpl) redirect('/templates')
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login?next=/templates')
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

/** A brand-new empty designer card ("start from scratch"). */
export async function createBlankCard() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login?next=/templates')
  const { data, error } = await supabase
    .from('invitations')
    .insert({ user_id: auth.user.id, slug: `card-${Math.random().toString(36).slice(2, 9)}`, template: 'blank', kind: 'canvas', canvas: emptyCanvas(), content: { eventType: 'Invitation', name1: 'My card' }, design: {} })
    .select('id')
    .single()
  if (error || !data) redirect('/dashboard?error=create')
  redirect(`/design/${data.id}`)
}

/** A new designer card that opens on the AI panel ("Create with AI": upload a design you like, describe your card). */
export async function createAiCard(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login?next=/templates')
  if (!(await isPremium(supabase, auth.user.id))) redirect('/premium?from=designer')
  const category = getCategory(String(formData.get('category') || ''))
  const { data, error } = await supabase
    .from('invitations')
    .insert({ user_id: auth.user.id, slug: `card-${Math.random().toString(36).slice(2, 9)}`, template: 'blank', kind: 'canvas', canvas: emptyCanvas(),
      content: { eventType: category?.name ?? 'Invitation', name1: 'My AI card' }, design: {} })
    .select('id')
    .single()
  if (error || !data) redirect('/dashboard?error=create')
  redirect(`/design/${data.id}?ai=1`)
}

/** Opens any ready-made template in the drag-and-drop designer, so every part can be changed. */
export async function createDesignFromTemplate(formData: FormData) {
  const template = getTemplate(String(formData.get('template') || ''))
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login?next=/templates')
  const title = [template.content.name1, template.content.name2].filter(Boolean).join(' & ') || template.name
  const { data, error } = await supabase
    .from('invitations')
    .insert({ user_id: auth.user.id, slug: makeSlug(template.content), template: template.id, kind: 'canvas',
      canvas: classicToCanvas(template.content, template.design), content: { ...template.content, name1: title }, design: {} })
    .select('id')
    .single()
  if (error || !data) redirect('/dashboard?error=create')
  redirect(`/design/${data.id}`)
}

/** Turns one of your quick-edit cards into a designer card (keeps the link, guests and replies). */
export async function convertToDesigner(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  const { data: row } = await supabase.from('invitations').select('content, design, template, kind').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!row) return { ok: false, error: 'Card not found.' }
  if (row.kind === 'canvas') return { ok: true }
  const { content, design } = normalize(row.content, row.design, row.template)
  const title = [content.name1, content.name2].filter(Boolean).join(' & ') || content.eventType || 'My card'
  const { error } = await supabase.from('invitations').update({ kind: 'canvas', canvas: classicToCanvas(content, design), content: { ...content, name1: title } })
    .eq('id', id).eq('user_id', auth.user.id)
  if (error) return saveResult(error, false)
  return { ok: true }
}
