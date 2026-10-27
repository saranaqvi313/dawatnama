import type { MetadataRoute } from 'next'
import { SEO_PAGES } from '@/lib/seoPages'
import { TEMPLATES } from '@/lib/types'

const base = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')).replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/templates`, lastModified: now, priority: .9 },
    { url: `${base}/cards`, lastModified: now, priority: .8 },
    ...SEO_PAGES.map((p) => ({ url: `${base}/cards/${p.slug}`, lastModified: now, priority: .8 })),
    ...TEMPLATES.map((t) => ({ url: `${base}/preview/${t.id}`, lastModified: now, priority: .5 })),
    ...['contact', 'terms', 'privacy', 'refund-policy'].map((p) => ({ url: `${base}/${p}`, lastModified: now, priority: .3 })),
  ]
}
