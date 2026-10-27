import { createHmac } from 'node:crypto'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Number-only sign-in. Supabase needs an SMS provider for any phone login, so each mobile number
 * gets an internal account: a placeholder email (never emailed) and a password the server derives
 * from the number. Users never see either; they only type their number.
 */
export function accountEmail(phone: string) {
  return `p${phone.replace(/\D/g, '')}@phone.dawatnama.app`
}

export function accountPassword(phone: string) {
  const key = process.env.LOGIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  // Prefix/suffix satisfy any "upper, lower, digit, symbol" password rule set in Supabase.
  return `Dw#${createHmac('sha256', key).update(`dawatnama-login:${phone}`).digest('hex')}Z9`
}

export async function findUser(admin: SupabaseClient, email: string, phone: string): Promise<User | null> {
  const digits = phone.replace(/\D/g, '')
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email || (u.phone && u.phone.replace(/\D/g, '') === digits))
    if (hit) return hit
    if (data.users.length < 1000) return null
  }
  return null
}

/** Makes sure the internal account for this number exists and accepts the derived password. */
export async function ensureAccount(admin: SupabaseClient, phone: string, name?: string) {
  const email = accountEmail(phone)
  const password = accountPassword(phone)
  const meta = { phone, ...(name ? { full_name: name } : {}) }

  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, phone, phone_confirm: true, user_metadata: meta })
  if (!created.error) return { email, password }

  // Already exists (or the number was used before): bring it in line and continue.
  const user = await findUser(admin, email, phone)
  if (!user) throw created.error
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email, password, email_confirm: true, phone, phone_confirm: true,
    user_metadata: { ...user.user_metadata, ...meta },
  })
  if (error) throw error
  return { email, password }
}
