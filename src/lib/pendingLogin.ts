/** Hands the phone number from the sign-in screen to the code screen (same tab only). */
export type PendingLogin = { value: string; display: string; next: string; sentAt: number }

const KEY = 'dawatnama-pending-login'

export function savePending(p: PendingLogin) {
  try { sessionStorage.setItem(KEY, JSON.stringify(p)) } catch { /* private mode: verify page asks to start again */ }
}

export function loadPending(): PendingLogin | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(KEY) || 'null') as PendingLogin | null
    if (!p || typeof p.value !== 'string' || !p.value.startsWith('+')) return null
    return { ...p, next: safeNext(p.next) }
  } catch { return null }
}

export function clearPending() {
  try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function safeNext(raw: string | null | undefined) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/dashboard'
}
