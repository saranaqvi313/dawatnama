/** Loads what a visitor sees at your-site.com/<name>: a card's open link or a guest's personal link. */
import { cache } from 'react'
import { createClient } from './supabase/server'

export type PublicGuest = { id: string; name: string; party_size: number; events: string[]; slug: string }
export type PublicCard = {
  id: string; slug: string; template: string; kind?: string; content: unknown; design: unknown; canvas?: unknown
  published: boolean; share_paid?: boolean
}

export const loadPublicCard = cache(async (slug: string): Promise<{ card: PublicCard; guest: PublicGuest | null; canReply: boolean } | null> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null
  const supabase = await createClient()
  // Row-level security returns the card only if its open link is live (or you own it).
  const { data: card } = await supabase.from('invitations').select('*').eq('slug', slug).maybeSingle()
  if (card) return { card: card as PublicCard, guest: null, canReply: Boolean(card.published && card.share_paid) }
  const { data } = await supabase.rpc('guest_invite', { p_slug: slug })
  const found = data as { invitation: PublicCard; guest: PublicGuest } | null
  if (!found?.invitation) return null
  return { card: found.invitation, guest: found.guest, canReply: true }
})
