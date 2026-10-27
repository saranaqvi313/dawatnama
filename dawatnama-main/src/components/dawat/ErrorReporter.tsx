'use client'
import { useEffect } from 'react'

/** Sends browser errors to /api/log-error so they appear on the admin page. At most 5 per page view. */
export function reportError(message: string, detail?: string) {
  const w = window as unknown as { __dnErrs?: number }
  w.__dnErrs = (w.__dnErrs ?? 0) + 1
  if (w.__dnErrs > 5) return
  try {
    const body = JSON.stringify({ message: String(message).slice(0, 1000), detail: detail?.slice(0, 4000), url: location.pathname })
    if (!navigator.sendBeacon?.('/api/log-error', new Blob([body], { type: 'application/json' })))
      void fetch('/api/log-error', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true })
  } catch { /* never let reporting break the page */ }
}

export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (!e.message || /ResizeObserver loop|Script error\.?$/.test(e.message)) return
      reportError(e.message, e.error?.stack ?? `${e.filename}:${e.lineno}`)
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { message?: string; stack?: string } | undefined
      reportError(r?.message ?? String(e.reason), r?.stack)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection) }
  }, [])
  return null
}
