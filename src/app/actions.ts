'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate, type Content, type Design } from '@/lib/types'

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
    .insert({ user_id: auth.user.id, slug: makeSlug(template.content), template: template.id, content: template.content, design: template.design })
    .select('id')
    .single()
  if (error || !data) redirect('/dashboard?error=create')
  redirect(`/dashboard/${data.id}`)
}

export async function saveInvitation(id: string, patch: { content: Content; design: Design; published: boolean }) {
  const supabase = await createClient()
  const { error } = await supabase.from('invitations').update(patch).eq('id', id)
  return { ok: !error, error: error?.message }
}

export async function deleteInvitation(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('invitations').delete().eq('id', String(formData.get('id')))
  redirect('/dashboard')
}
