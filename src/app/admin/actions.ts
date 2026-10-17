'use server'
import { revalidatePath } from 'next/cache'
import { currentAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

/** Support tool: add guest links (or Premium) to a user's account, e.g. after a payment problem. */
export async function grantToUser(formData: FormData) {
  if (!(await currentAdmin())) throw new Error('Not allowed')
  const userId = String(formData.get('user_id') || '')
  const credits = Math.max(0, Math.min(1000, Math.round(Number(formData.get('credits')) || 0)))
  const premium = formData.get('premium') === 'on'
  if (!/^[0-9a-f-]{36}$/i.test(userId) || (!credits && !premium)) return
  const admin = createAdminClient()
  const { data: row } = await admin.from('profiles').select('link_credits, is_premium, premium_since').eq('user_id', userId).maybeSingle()
  await admin.from('profiles').upsert({
    user_id: userId,
    link_credits: (row?.link_credits ?? 0) + credits,
    is_premium: Boolean(row?.is_premium) || premium,
    premium_since: row?.premium_since ?? (premium ? new Date().toISOString() : null),
    updated_at: new Date().toISOString(),
  })
  revalidatePath('/admin')
}

export async function clearErrors() {
  if (!(await currentAdmin())) throw new Error('Not allowed')
  await createAdminClient().from('error_logs').delete().lt('created_at', new Date().toISOString())
  revalidatePath('/admin')
}
