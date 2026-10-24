import { notFound } from 'next/navigation'
import InvitationPage, { generateMetadata as invitationMetadata } from '../i/[slug]/page'
import { isPossibleSlug } from '@/lib/slug'

type Props = { params: Promise<{ slug: string }> }

/** Short card links: your-site.com/ali-khan (the same card as /i/ali-khan). */
export async function generateMetadata(props: Props) {
  const { slug } = await props.params
  if (!isPossibleSlug(slug)) return { title: 'Not found' }
  return invitationMetadata(props)
}

export default async function ShortLink(props: Props) {
  const { slug } = await props.params
  if (!isPossibleSlug(slug)) notFound()
  return InvitationPage(props)
}
