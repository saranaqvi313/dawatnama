import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import InvitationView from '@/components/InvitationView'
import { createClient } from '@/lib/supabase/server'
import { normalize } from '@/lib/types'
import CanvasPage from '@/components/canvas/CanvasPage'
import { sanitizeCanvas } from '@/lib/canvas'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const supabase = await createClient()
  // Row-level security returns the row only if it is published (or you own it).
  const { data } = await supabase.from('invitations').select('*').eq('slug', slug).maybeSingle()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await load((await params).slug)
  if (!row) return { title: 'Invitation not found' }
  if (row.kind === 'canvas') {
    const title = String(row.content?.name1 || 'You are invited')
    return { title, description: 'You are invited. Open the card to see the details.', openGraph: { title, description: 'You are invited.' } }
  }
  const { content } = normalize(row.content, row.design, row.template)
  const title = `${[content.name1, content.name2].filter(Boolean).join(' & ')} — ${content.eventType}`
  const description = content.message || content.heading
  return { title, description, openGraph: { title, description, images: content.photoUrl ? [content.photoUrl] : undefined } }
}

export default async function InvitationPage({ params }: Props) {
  const row = await load((await params).slug)
  if (!row) notFound()
  if (row.kind === 'canvas') return <CanvasPage doc={sanitizeCanvas(row.canvas)} />
  const { content, design } = normalize(row.content, row.design, row.template)
  return <div className="full"><InvitationView content={content} design={design} invitationId={row.published ? row.id : undefined} /></div>
}
