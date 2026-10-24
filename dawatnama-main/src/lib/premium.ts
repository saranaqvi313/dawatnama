import type { SupabaseClient, User } from '@supabase/supabase-js'

/** True when the user has paid for Premium. Reads the user's own profile row (RLS-protected). */
export async function isPremium(supabase: SupabaseClient, userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false
  const { data } = await supabase.from('profiles').select('is_premium').eq('user_id', userId).maybeSingle()
  return Boolean(data?.is_premium)
}

/** How many unused guest-link credits the user has. */
export async function linkCredits(supabase: SupabaseClient, userId: string | undefined | null): Promise<number> {
  if (!userId) return 0
  const { data } = await supabase.from('profiles').select('link_credits').eq('user_id', userId).maybeSingle()
  return Math.max(0, Number(data?.link_credits ?? 0))
}

export function displayName(user: User): string {
  const full = String(user.user_metadata?.full_name || '').trim()
  if (full) return full
  if (user.phone) return `+${user.phone.replace(/^\+/, '')}`
  if (user.email && !user.email.endsWith('@phone.dawatnama.app')) return user.email.split('@')[0]
  return 'Account'
}
