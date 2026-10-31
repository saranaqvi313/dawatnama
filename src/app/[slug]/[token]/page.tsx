import { notFound } from 'next/navigation'
import InvitationPage, { generateMetadata as invitationMetadata } from '../../i/[slug]/page'
import { isPossibleToken } from '@/lib/publicCard'
import { isPossibleSlug } from '@/lib/slug'

type Props = { params: Promise<{ slug: string; token: string }> }

/** A guest's personal link: your-site.com/ali-khan/3f9a1c7b2d4e. The code must match the name. */
export async function generateMetadata(props: Props) {
  const { slug, token } = await props.params
  if (!isPossibleSlug(slug) || !isPossibleToken(token)) return { title: 'Not found' }
  return invitationMetadata(props)
}

export default async function GuestLink(props: Props) {
  const { slug, token } = await props.params
  if (!isPossibleSlug(slug) || !isPossibleToken(token)) notFound()
  return InvitationPage(props)
}
