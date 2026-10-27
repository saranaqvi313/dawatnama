import { redirect } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import SettingsView from '@/components/dawat/settings/SettingsView'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'Settings — Dawatnama' }
export const dynamic = 'force-dynamic'

export default async function Settings() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/settings')
  const user = (await (await createClient()).auth.getUser()).data.user
  return (
    <Shell title="Profile settings" viewer={viewer}>
      <SettingsView viewer={viewer} legacyPassword={!user?.user_metadata?.password_set} />
    </Shell>
  )
}
