'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      void fetch('/api/log-error', { method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ message: error.message || 'App crashed', detail: `${error.digest ?? ''}\n${error.stack ?? ''}`, url: location.pathname }) })
    } catch { /* ignore */ }
  }, [error])
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem 1.2rem', textAlign: 'center', background: '#faf6ee', color: '#12382d' }}>
        <h1>Something went wrong</h1>
        <p>The problem has been reported to us. Please try again.</p>
        <button onClick={reset} style={{ padding: '.7em 1.4em', borderRadius: 999, border: 0, background: '#12382d', color: '#fff' }}>Try again</button>
      </body>
    </html>
  )
}
