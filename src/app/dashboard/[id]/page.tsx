import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Editor from '@/components/Editor'
import { createClient } from '@/lib/supabase/server'
import { isPremium, linkCredits } from '@/lib/premium'
import { normalize, type Invitation } from '@/lib/types'

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pay?: string }> }) {
  const { id } = await params
  const pay = (await searchParams).pay
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data } = await supabase.from('invitations').select('*').eq('id', id).eq('user_id', auth.user?.id ?? '').maybeSingle()
  if (!data) notFound()
  const h = await headers()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
  if (data.kind === 'canvas') redirect(`/design/${data.id}${pay ? `?pay=${encodeURIComponent(pay)}` : ''}`)
  const invitation = { ...data, ...normalize(data.content, data.design, data.template) } as Invitation
  const [premium, credits] = await Promise.all([isPremium(supabase, auth.user?.id), linkCredits(supabase, auth.user?.id)])
  return <Editor invitation={invitation} siteUrl={siteUrl.replace(/\/$/, '')} premium={premium} sharePaid={Boolean(data.share_paid)} credits={credits} payResult={pay} />
}
