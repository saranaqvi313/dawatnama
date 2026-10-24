import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import InvitationsBoard from '@/components/dawat/InvitationsBoard'
import { loadMyCards } from '@/lib/myCards'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'My invitations — Dawatnama' }
export const dynamic = 'force-dynamic'

export default async function Invitations() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/invitations')
  const { cards } = await loadMyCards(await createClient(), viewer.id)
  const h = await headers()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`).replace(/\/$/, '')
  return (
    <Shell title="My invitations" viewer={viewer}>
      <InvitationsBoard cards={cards} siteUrl={siteUrl} />
    </Shell>
  )
}
