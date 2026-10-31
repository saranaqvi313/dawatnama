import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import InvitationView from '@/components/dawat/InvitationView'
import CanvasPage from '@/components/dawat/canvas/CanvasPage'
import { sanitizeCanvas } from '@/lib/canvas'
import { loadPublicCard } from '@/lib/publicCard'
import { normalize, type EventItem } from '@/lib/types'

/** `token` is set on a guest's personal link (your-site.com/ali-khan/<code>). */
type Props = { params: Promise<{ slug: string; token?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, token } = await params
  const found = await loadPublicCard(slug, token)
  if (!found) return { title: 'Invitation not found' }
  const { card, guest } = found
  const dear = guest ? `${guest.name}, you are invited` : 'You are invited'
  if (card.kind === 'canvas') {
    const title = String((card.content as { name1?: string })?.name1 || 'You are invited')
    return { title, description: `${dear}. Open the card to see the details.`, openGraph: { title, description: `${dear}.` }, robots: { index: false } }
  }
  const { content } = normalize(card.content as never, card.design as never, card.template)
  const names = [content.name1, content.name2].filter(Boolean).join(' & ')
  const title = names ? `${names} · ${content.eventType}` : content.eventType
  const description = guest ? `${dear} to ${content.eventType.toLowerCase()} celebrations. Tap to open your invitation.` : content.message || content.heading
  return { title, description, openGraph: { title, description, type: 'website' }, twitter: { card: 'summary_large_image', title, description }, robots: { index: false } }
}

export default async function InvitationPage({ params }: Props) {
  const { slug, token } = await params
  const found = await loadPublicCard(slug, token)
  if (!found) notFound()
  const { card, guest, canReply } = found
  const updatedAt = card.details_updated_at ?? null
  if (card.kind === 'canvas') return <CanvasPage doc={sanitizeCanvas(card.canvas)} guest={guest} slug={slug} canReply={canReply} invitationId={card.id} title={String((card.content as { name1?: string } | null)?.name1 ?? '')}
    updatedAt={updatedAt}
    events={Array.isArray((card.content as { events?: unknown } | null)?.events) ? ((card.content as { events: EventItem[] }).events.filter((e) => e && typeof e.name === 'string' && e.name.trim())) : []} />
  const { content, design } = normalize(card.content as never, card.design as never, card.template)
  return (
    <div className="full">
      <InvitationView content={content} design={design} invitationId={canReply ? card.id : undefined} guest={guest} trackSlug={slug} updatedAt={updatedAt} />
    </div>
  )
}
