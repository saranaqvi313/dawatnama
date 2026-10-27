'use client'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const BUTTON_LIKE = 'a[class*="rounded-3xl"], a[data-busy]'

/**
 * Feedback for every click that opens another page of the site, until that page has loaded:
 * - a thin loading bar along the top of the screen,
 * - a spinner inside button-style links (kit buttons),
 * - a small spinner after the text of other links (sidebar, menus, tabs, table actions).
 */
export default function BusyLinks() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [loading, setLoading] = useState(false)

  // The new page has arrived: clear everything.
  useEffect(() => {
    document.querySelectorAll('[data-busy-link]').forEach((el) => { el.removeAttribute('aria-busy'); el.removeAttribute('data-loading'); el.removeAttribute('data-busy-link') })
    document.documentElement.classList.remove('navigating')
    setLoading(false)
  }, [pathname, search])

  useEffect(() => {
    let safety = 0
    const clear = () => {
      document.querySelectorAll('[data-busy-link]').forEach((el) => { el.removeAttribute('aria-busy'); el.removeAttribute('data-loading'); el.removeAttribute('data-busy-link') })
      document.documentElement.classList.remove('navigating')
      setLoading(false)
    }
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return // same page or #anchor
      if (a.matches(BUTTON_LIKE)) a.setAttribute('aria-busy', 'true')
      else if (!a.querySelector('img, canvas, .cv, .scene-mini')) a.setAttribute('data-loading', '')
      a.setAttribute('data-busy-link', '')
      document.documentElement.classList.add('navigating')
      setLoading(true)
      window.clearTimeout(safety)
      safety = window.setTimeout(clear, 20000) // never spin forever (e.g. a slow network gave up)
    }
    document.addEventListener('click', onClick, true) // capture: runs before Next's <Link> handles the click
    window.addEventListener('pageshow', clear) // back/forward cache restores the old page
    return () => { document.removeEventListener('click', onClick, true); window.removeEventListener('pageshow', clear); window.clearTimeout(safety) }
  }, [])

  return loading ? <div className="dn-topbar" role="progressbar" aria-label="Loading page" /> : null
}
