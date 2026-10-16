'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate, type Content, type Design } from '@/lib/types'
import { isPremium } from '@/lib/premium'
import { sanitizeCanvas } from '@/lib/canvas'
import { getCanvasTemplate } from '@/lib/canvasTemplates'

export async function submitRsvp(input: { invitationId: string; name: string; attending: string; guests: number; message: string }) {
  const name = input.name.trim().slice(0, 80)
  const attending = ['yes', 'no', 'maybe'].includes(input.attending) ? input.attending : 'yes'
  const guests = attending === 'no' ? 0 : Math.min(20, Math.max(1, Math.floor(Number(input.guests) || 1)))
  if (!name || !input.invitationId) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase.from('rsvps').insert({
    invitation_id: input.invitationId, name, attending, guests, message: input.message.trim().slice(0, 500) || null,
  })
  return { ok: !error }
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

export async function saveInvitation(id: string, patch: { content: Content; design: Design; published: boolean }) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  const premium = await isPremium(supabase, auth.user.id)
  // Free accounts save text, events and publishing only; the database rejects design changes too.
  const update = premium ? patch : { content: patch.content, published: patch.published }
  const { error } = await supabase.from('invitations').update(update).eq('id', id).eq('user_id', auth.user.id)
  if (error?.message.includes('premium_required')) return { ok: false, error: 'Customising the design needs Premium.' }
  return { ok: !error, error: error?.message }
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
export async function saveCanvas(id: string, input: { doc: unknown; title: string; published: boolean }) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  if (!(await isPremium(supabase, auth.user.id))) return { ok: false, error: 'The designer needs Premium.' }
  const { data: row } = await supabase.from('invitations').select('content').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!row) return { ok: false, error: 'Card not found.' }
  const title = String(input.title ?? '').trim().slice(0, 80) || 'My card'
  const { error } = await supabase.from('invitations')
    .update({ canvas: sanitizeCanvas(input.doc), published: Boolean(input.published), content: { ...(row.content ?? {}), name1: title } })
    .eq('id', id).eq('user_id', auth.user.id)
  if (error?.message.includes('premium_required')) return { ok: false, error: 'The designer needs Premium.' }
  return { ok: !error, error: error?.message }
}
