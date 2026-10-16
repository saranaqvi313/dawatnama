import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookieOptions: { name: 'sb-dawatnama-auth' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  if (!data.user && (path.startsWith('/dashboard') || path.startsWith('/design'))) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`
    return NextResponse.redirect(login)
  }
  return response
}

export const config = { matcher: ['/', '/dashboard/:path*', '/design/:path*', '/login/:path*', '/auth/:path*', '/templates', '/premium/:path*', '/api/pay/:path*'] }
