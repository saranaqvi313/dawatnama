/** The signed-in person, for the dashboard header, sidebar and menus. Server-only. */
import type { User } from '@supabase/supabase-js'
import { isAdminUser } from './admin'
import { displayName } from './premium'
import { createClient } from './supabase/server'
import { FREE_MODE } from './pricing'

export type Viewer = {
  id: string
  name: string
  phone: string
  initials: string
  premium: boolean
  credits: number
  isAdmin: boolean
}

export function phoneOf(user: User) {
  const raw = String(user.user_metadata?.phone || (user.phone ? `+${user.phone.replace(/^\+/, '')}` : ''))
  return raw.startsWith('+92') ? `0${raw.slice(3, 6)} ${raw.slice(6)}` : raw
}

export function initialsOf(name: string) {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'D'
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase()
}

export async function getViewer(): Promise<Viewer | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_premium, link_credits').eq('user_id', user.id).maybeSingle()
  const name = displayName(user)
  const phone = phoneOf(user)
  return {
    id: user.id,
    name: name === 'Account' ? phone || name : name,
    phone,
    initials: initialsOf(name === 'Account' ? 'Dawatnama' : name),
    premium: FREE_MODE || Boolean(data?.is_premium),
    credits: Math.max(0, Number(data?.link_credits ?? 0)),
    isAdmin: isAdminUser(user),
  }
}
