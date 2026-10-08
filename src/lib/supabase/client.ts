import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(`${window.location.origin}/sb`, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { name: 'sb-dawatnama-auth' },
  })
}
