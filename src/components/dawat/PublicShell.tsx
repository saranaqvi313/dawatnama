import Link from 'next/link'
import type { ReactNode } from 'react'
import Button from '@/components/Button'
import ThemeButton from '@/components/ThemeButton'
import { BUSINESS } from '@/lib/business'
import type { Viewer } from '@/lib/viewer'
import PublicMenu from './PublicMenu'

const NAV = [
  ['Templates', '/templates'],
  ['How it works', '/#how'],
  ['Card ideas', '/cards'],
  ['Questions', '/#faq'],
] as const

/** Simple header and footer for the public pages (home, templates, card ideas). */
export default function PublicShell({ viewer, children }: { viewer: Viewer | null; children: ReactNode }) {
  return (
    <div className="min-h-svh bg-b-surface1">
      <header className="sticky top-0 z-30 bg-b-surface1/90 backdrop-blur-md">
        <div className="flex items-center gap-6 max-w-300 mx-auto h-20 px-6 max-md:h-16 max-md:px-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Dawatnama home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-dawatnama.svg" alt="" width={40} height={40} className="size-10 max-md:size-9" />
            <span className="text-h6">Dawatnama</span>
          </Link>
          <nav className="flex items-center gap-1 mr-auto max-lg:hidden" aria-label="Main">
            {NAV.map(([l, h]) => (
              <Link key={h} href={h} className="px-3.5 py-2 rounded-full text-button text-t-secondary transition-colors hover:text-t-primary hover:bg-b-surface2">{l}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            {viewer ? (
              <Button isBlack as="link" href="/dashboard" className="max-md:!h-10 max-md:!px-4">My cards</Button>
            ) : (
              <>
                <Button isWhite as="link" href="/login" className="max-md:hidden">Sign in</Button>
                <Button isBlack as="link" href="/templates" className="max-md:!h-10 max-md:!px-4">Make a card</Button>
              </>
            )}
            <PublicMenu items={NAV.map(([l, h]) => [l, h])} signedIn={Boolean(viewer)} />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-s-subtle">
        <div className="flex flex-wrap items-start justify-between gap-8 max-w-300 mx-auto px-6 py-10 max-md:px-4">
          <div className="max-w-80">
            <div className="flex items-center gap-2 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-dawatnama.svg" alt="" width={32} height={32} className="size-8" />
              <span className="text-sub-title-1">{BUSINESS.name}</span>
            </div>
            <p className="text-body-2 text-t-secondary">Digital wedding cards and invitations for Pakistan. Free to make, easy to share on WhatsApp.</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-body-2" aria-label="Footer">
            {[['Templates', '/templates'], ['Card ideas', '/cards'], ['Contact', '/contact'], ['Terms', '/terms'], ['Privacy', '/privacy'], ['Refunds', '/refund-policy']].map(([l, h]) => (
              <Link key={h} href={h} className="text-t-secondary transition-colors hover:text-t-primary">{l}</Link>
            ))}
          </nav>
          <ThemeButton className="!flex-row" />
        </div>
        <div className="max-w-300 mx-auto px-6 pb-8 text-caption text-t-tertiary max-md:px-4">© {new Date().getFullYear()} {BUSINESS.name}. Made in Pakistan.</div>
      </footer>
    </div>
  )
}
