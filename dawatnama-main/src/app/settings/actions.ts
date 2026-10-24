'use server'
import { revalidatePath } from 'next/cache'
import { createClient as createPlainClient } from '@supabase/supabase-js'
import { accountEmail } from '@/lib/phoneAccount'
import { passwordProblem } from '@/lib/password'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; error?: string }

/** Changes the name shown in the dashboard. */
export async function updateName(name: string): Promise<Result> {
  const clean = String(name ?? '').trim().slice(0, 60)
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Please sign in again.' }
  const { error } = await supabase.auth.updateUser({ data: { ...auth.user.user_metadata, full_name: clean } })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Changes the password after checking the current one. */
export async function changePassword(current: string, next: string): Promise<Result> {
  const problem = passwordProblem(String(next ?? ''))
  if (problem) return { ok: false, error: problem }
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return { ok: false, error: 'Please sign in again.' }
  const phone = String(user.user_metadata?.phone || (user.phone ? `+${user.phone.replace(/^\+/, '')}` : ''))
  const email = user.email || (phone ? accountEmail(phone) : '')
  if (!email) return { ok: false, error: 'This account cannot change its password here. Please contact us.' }
  // Check the current password on a separate client, so a wrong guess cannot touch this session.
  const checker = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const check = await checker.auth.signInWithPassword({ email, password: String(current ?? '') })
  if (!check.error) void checker.auth.signOut({ scope: 'local' })
  if (check.error) return { ok: false, error: 'Your current password is not right.' }
  const { error } = await supabase.auth.updateUser({ password: next, data: { ...user.user_metadata, password_set: true } })
  if (error) return { ok: false, error: error.message.includes('different') ? 'Choose a password you have not used for this account.' : error.message }
  return { ok: true }
}
