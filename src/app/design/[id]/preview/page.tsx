import { notFound, redirect } from 'next/navigation'
import CanvasPage from '@/components/dawat/canvas/CanvasPage'
import { sanitizeCanvas } from '@/lib/canvas'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Preview — Dawatnama', robots: { index: false } }
export const dynamic = 'force-dynamic'

/** The owner's preview of a designer card, exactly as guests will see it (opening, effects, music). */
export default async function DesignPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect(`/login?next=/design/${id}/preview`)
  const { data } = await supabase.from('invitations').select('kind, canvas, content').eq('id', id).eq('user_id', auth.user.id).maybeSingle()
  if (!data || data.kind !== 'canvas') notFound()
  return <CanvasPage doc={sanitizeCanvas(data.canvas)} title={String((data.content as { name1?: string } | null)?.name1 ?? '')} />
}
