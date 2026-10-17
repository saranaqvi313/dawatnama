/** Who can open /admin: the mobile numbers listed in ADMIN_PHONES (comma separated). Server-only. */
import type { User } from '@supabase/supabase-js'
import { normalizePhone } from './identity'
import { createClient } from './supabase/server'

export function adminPhones(): string[] {
  return (process.env.ADMIN_PHONES || '').split(',').map((p) => normalizePhone(p.trim())).filter((p): p is string => Boolean(p))
}

export function isAdminUser(user: User | null | undefined) {
  if (!user) return false
  const phone = String(user.user_metadata?.phone || (user.phone ? `+${user.phone.replace(/^\+/, '')}` : ''))
  return Boolean(phone) && adminPhones().includes(phone)
}

export async function currentAdmin() {
  const user = (await (await createClient()).auth.getUser()).data.user
  return isAdminUser(user) ? user : null
}
