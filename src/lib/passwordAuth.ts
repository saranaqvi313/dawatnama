/**
 * Mobile number + password sign-in. Server-only.
 * - New number: creates the account with the chosen password.
 * - Account made before passwords existed (number-only): the first password typed becomes its password.
 * - Otherwise: the password must match (checked by Supabase, which stores it hashed).
 * `mode` comes from the sign-in screen: "signin" never creates an account, "signup" never signs
 * in to someone else's existing account. Without it (older clients) both are allowed.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { accountEmail, findUser } from './phoneAccount'
import { passwordProblem } from './password'

type Result = { ok: true; created: boolean; claimed: boolean } | { ok: false; status: number; error: string }

// Slows down password guessing for a number (per server instance).
const fails = new Map<string, { n: number; t: number }>()
const WINDOW = 15 * 60 * 1000, MAX_FAILS = 8

export function tooManyTries(phone: string) {
  const f = fails.get(phone)
  return Boolean(f && Date.now() - f.t < WINDOW && f.n >= MAX_FAILS)
}
function noteFail(phone: string) {
  const f = fails.get(phone)
  fails.set(phone, f && Date.now() - f.t < WINDOW ? { n: f.n + 1, t: f.t } : { n: 1, t: Date.now() })
  if (fails.size > 10000) fails.clear()
}

export async function signInWithPhonePassword(
  admin: SupabaseClient, session: SupabaseClient, phone: string, password: string, name?: string,
  mode?: 'signin' | 'signup',
): Promise<Result> {
  if (tooManyTries(phone)) return { ok: false, status: 429, error: 'Too many wrong passwords. Please wait 15 minutes and try again.' }
  const email = accountEmail(phone)

  const first = await session.auth.signInWithPassword({ email, password })
  if (!first.error) return { ok: true, created: false, claimed: false }

  const user = await findUser(admin, email, phone)
  const meta = { phone, ...(name ? { full_name: name } : {}) }

  if (!user && mode === 'signin') {
    noteFail(phone)
    return { ok: false, status: 404, error: 'There is no account with this number yet. Tap “Sign up” to create one.' }
  }
  if (user?.user_metadata?.password_set && mode === 'signup') {
    noteFail(phone)
    return { ok: false, status: 409, error: 'This number already has an account. Tap “Sign in” and use your password.' }
  }

  if (!user) {
    const problem = passwordProblem(password)
    if (problem) return { ok: false, status: 400, error: problem }
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, phone, phone_confirm: true, user_metadata: { ...meta, password_set: true } })
    if (created.error) throw created.error
  } else if (!user.user_metadata?.password_set) {
    const problem = passwordProblem(password)
    if (problem) return { ok: false, status: 400, error: `Set a password for your account. ${problem}` }
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email, password, email_confirm: true, user_metadata: { ...user.user_metadata, ...meta, password_set: true },
    })
    if (error) throw error
  } else {
    noteFail(phone)
    return { ok: false, status: 401, error: 'Wrong password for this number. Forgot it? Contact us and we will reset it.' }
  }

  const second = await session.auth.signInWithPassword({ email, password })
  if (second.error) throw second.error
  return { ok: true, created: !user, claimed: Boolean(user) }
}

/** Admin tool: give a user a new password (for "forgot password"). */
export async function adminSetPassword(admin: SupabaseClient, userId: string, password: string) {
  const problem = passwordProblem(password)
  if (problem) return problem
  const { data } = await admin.auth.admin.getUserById(userId)
  const { error } = await admin.auth.admin.updateUserById(userId, { password, user_metadata: { ...(data.user?.user_metadata ?? {}), password_set: true } })
  return error ? error.message : ''
}
