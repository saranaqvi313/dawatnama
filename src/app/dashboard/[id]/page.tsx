import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Editor from '@/components/Editor'
import { createClient } from '@/lib/supabase/server'
import { normalize, type Invitation } from '@/lib/types'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data } = await supabase.from('invitations').select('*').eq('id', id).eq('user_id', auth.user?.id ?? '').maybeSingle()
  if (!data) notFound()
  const h = await headers()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
  const invitation = { ...data, ...normalize(data.content, data.design, data.template) } as Invitation
  return <Editor invitation={invitation} siteUrl={siteUrl.replace(/\/$/, '')} />
}
