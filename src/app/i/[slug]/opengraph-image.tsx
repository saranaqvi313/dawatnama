import { cardImage, OG_SIZE } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Invitation card'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return cardImage((await params).slug)
}
