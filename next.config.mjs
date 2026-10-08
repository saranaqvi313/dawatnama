const sb = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')

/** @type {import('next').NextConfig} */
export default {
  eslint: { ignoreDuringBuilds: true },
  // Browsers talk to Supabase through this site (/sb/...), so networks that
  // interfere with direct connections to supabase.co cannot break sign-in.
  async rewrites() {
    return sb ? [{ source: '/sb/:path*', destination: `${sb}/:path*` }] : []
  },
}
