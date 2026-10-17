'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Shows a spinner on a button-style link (and nav links) from the click until the next page
 * has loaded, so every click gives feedback even on a slow connection.
 */
export default function BusyLinks() {
  const pathname = usePathname()
  const search = useSearchParams()

  useEffect(() => {
    document.querySelectorAll('[data-busy-link]').forEach((el) => { el.removeAttribute('aria-busy'); el.removeAttribute('data-busy-link') })
    document.documentElement.classList.remove('navigating')
  }, [pathname, search])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || !a.matches('a.btn, .nav nav a') || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return  // same page / #anchor
      a.setAttribute('aria-busy', 'true'); a.setAttribute('data-busy-link', '')
      document.documentElement.classList.add('navigating')
      window.setTimeout(() => { a.removeAttribute('aria-busy'); a.removeAttribute('data-busy-link'); document.documentElement.classList.remove('navigating') }, 15000)
    }
    const onShow = () => document.querySelectorAll('[data-busy-link]').forEach((el) => el.removeAttribute('aria-busy'))
    document.addEventListener('click', onClick)
    window.addEventListener('pageshow', onShow)
    return () => { document.removeEventListener('click', onClick); window.removeEventListener('pageshow', onShow) }
  }, [])

  return null
}
