import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Designer from '@/components/dawat/canvas/Designer'
import Shell from '@/components/dawat/Shell'
import { sanitizeCanvas } from '@/lib/canvas'
import { isPremium, linkCredits } from '@/lib/premium'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Designer — Dawatnama' }

export default async function DesignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pay?: string }> }) {
  const { id } = await params
  const pay = (await searchParams).pay
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect(`/login?next=/design/${id}`)
  const { data } = await supabase.from('invitations').select('*').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!data) notFound()
  if (data.kind !== 'canvas') redirect(`/dashboard/${id}`)
  if (!(await isPremium(supabase, auth.user.id))) redirect('/premium?from=designer')
  const h = await headers()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`).replace(/\/$/, '')
  return (
    <Shell title="Designer" hideSidebar>
    <Designer invitationId={data.id} userId={auth.user.id} slug={data.slug} siteUrl={siteUrl}
      initial={sanitizeCanvas(data.canvas)} initialTitle={String(data.content?.name1 || 'My card')} initialPublished={data.published}
      sharePaid={Boolean(data.share_paid)} credits={await linkCredits(supabase, auth.user.id)} payResult={pay} />
    </Shell>
  )
}
