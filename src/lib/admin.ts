/**
 * Who can open /admin: the mobile numbers in ADMIN_PHONES (comma separated). While SMS codes are
 * off, anyone could type an admin's number, so the admin page also asks for ADMIN_PASSWORD.
 * Server-only.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'
import { normalizePhone } from './identity'
import { OTP_ENABLED } from './otp'
import { createClient } from './supabase/server'

export const ADMIN_COOKIE = 'dn_admin'

export function adminPhones(): string[] {
  return (process.env.ADMIN_PHONES || '').split(',').map((p) => normalizePhone(p.trim())).filter((p): p is string => Boolean(p))
}

export function isAdminUser(user: User | null | undefined) {
  if (!user) return false
  const phone = String(user.user_metadata?.phone || (user.phone ? `+${user.phone.replace(/^\+/, '')}` : ''))
  return Boolean(phone) && adminPhones().includes(phone)
}

function unlockToken(userId: string) {
  const key = `${process.env.ADMIN_PASSWORD ?? ''}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`
  return createHmac('sha256', key).update(`admin:${userId}`).digest('hex')
}

export function passwordMatches(input: string) {
  const want = process.env.ADMIN_PASSWORD ?? ''
  if (!want) return false
  const a = Buffer.from(createHmac('sha256', 'cmp').update(input).digest('hex'))
  const b = Buffer.from(createHmac('sha256', 'cmp').update(want).digest('hex'))
  return timingSafeEqual(a, b)
}

/** 'ok' = full access; 'locked' = admin number, password still needed; 'no-password' = ADMIN_PASSWORD not set; 'no' = not an admin. */
export async function adminState(): Promise<{ state: 'ok' | 'locked' | 'no-password' | 'no'; user: User | null }> {
  const user = (await (await createClient()).auth.getUser()).data.user
  if (!isAdminUser(user) || !user) return { state: 'no', user: null }
  if (OTP_ENABLED) return { state: 'ok', user }
  if (!process.env.ADMIN_PASSWORD) return { state: 'no-password', user }
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value ?? ''
  const want = unlockToken(user.id)
  const ok = cookie.length === want.length && timingSafeEqual(Buffer.from(cookie), Buffer.from(want))
  return { state: ok ? 'ok' : 'locked', user }
}

export async function currentAdmin() {
  const { state, user } = await adminState()
  return state === 'ok' ? user : null
}

export async function setAdminUnlocked(userId: string) {
  (await cookies()).set(ADMIN_COOKIE, unlockToken(userId), { httpOnly: true, secure: true, sameSite: 'strict', path: '/admin', maxAge: 60 * 60 * 8 })
}
