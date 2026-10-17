import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import BusyLinks from '@/components/BusyLinks'
import Footer from '@/components/Footer'
import ErrorReporter from '@/components/ErrorReporter'
import { getLang } from '@/lib/supabase/server'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')),
  title: 'Dawatnama — Digital invitations for Pakistan',
  description: 'Animated shadi cards and event invitations with RSVP. Pick a template, make it yours, share your link on WhatsApp.',
  openGraph: { title: 'Dawatnama — Digital invitations for Pakistan', description: 'Animated shadi cards and event invitations with RSVP.', type: 'website', locale: 'en_PK' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Italianno&family=Marcellus&family=Monsieur+La+Doulaise&family=Parisienne&family=Petit+Formal+Script&family=Pinyon+Script&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&family=Rouge+Script&family=Tangerine:wght@400;700&display=swap" />
      </head>
      <body>
        <Suspense fallback={null}><BusyLinks /></Suspense>
        {children}
        <Footer />
        <ErrorReporter />
      </body>
    </html>
  )
}
