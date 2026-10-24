import { notFound } from 'next/navigation'
import InvitationView from '@/components/dawat/InvitationView'
import CanvasPage from '@/components/dawat/canvas/CanvasPage'
import { getCanvasTemplate } from '@/lib/canvasTemplates'
import { TEMPLATES } from '@/lib/types'

export default async function Preview({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params
  const design = getCanvasTemplate(template)
  if (design) return <CanvasPage doc={design.doc} />
  const t = TEMPLATES.find((x) => x.id === template)
  if (!t) notFound()
  return <div className="full"><InvitationView content={t.content} design={t.design} /></div>
}
