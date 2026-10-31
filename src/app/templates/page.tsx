import Shell from '@/components/dawat/Shell'
import PublicShell from '@/components/dawat/PublicShell'
import TemplatesGallery from '@/components/dawat/TemplatesGallery'
import { getCategory, isCategory } from '@/lib/categories'
import { getViewer } from '@/lib/viewer'

type Props = { searchParams: Promise<{ category?: string }> }

export async function generateMetadata({ searchParams }: Props) {
  const c = getCategory(String((await searchParams).category ?? ''))
  return c
    ? { title: `${c.name} invitation cards — Dawatnama`, description: `${c.note}: digital invitation cards with RSVP. Edit any of them for free.` }
    : { title: 'Templates — Dawatnama', description: 'Wedding and event invitation templates. Edit any of them for free, or start from a blank card.' }
}

export default async function Templates({ searchParams }: Props) {
  const raw = (await searchParams).category
  const category = isCategory(raw) ? raw : undefined
  const viewer = await getViewer()
  if (viewer)
    return (
      <Shell title="New card" viewer={viewer}>
        <div className="card px-8 py-8 max-lg:px-5 max-md:px-3 max-md:py-5"><TemplatesGallery category={category} /></div>
      </Shell>
    )
  return (
    <PublicShell viewer={null}>
      <div className="max-w-300 mx-auto px-6 pt-6 max-md:px-4">
        <h1 className="mb-2 text-h3 max-md:text-h4">Choose a card to start</h1>
        <p className="max-w-160 mb-10 text-body-1 text-t-secondary">Every card is free to make and share. Change names, dates, colours and photos, add music, video and fairy-tale animations.</p>
        <TemplatesGallery category={category} />
      </div>
    </PublicShell>
  )
}
