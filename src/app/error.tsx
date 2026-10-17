'use client'
import { useEffect } from 'react'
import { reportError } from '@/components/ErrorReporter'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error.message || 'Page error', `${error.digest ?? ''}\n${error.stack ?? ''}`) }, [error])
  return (
    <section className="auth">
      <h1>Something went wrong</h1>
      <p className="muted">The problem has been reported to us. Please try again.</p>
      <div className="row-actions">
        <button className="btn" onClick={reset}>Try again</button>
        <a className="btn ghost" href="/">Go to the home page</a>
      </div>
    </section>
  )
}
