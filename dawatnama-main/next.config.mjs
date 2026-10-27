const sb = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')

/** @type {import('next').NextConfig} */
export default {
  eslint: { ignoreDuringBuilds: true },
  // Browsers talk to Supabase through this site (/sb/...), so networks that
  // interfere with direct connections to supabase.co cannot break sign-in.
  // Pages that moved when the site was simplified.
  async redirects() {
    return [
      { source: '/designs', destination: '/templates', permanent: false },
      { source: '/demo/:path*', destination: '/dashboard', permanent: false },
      { source: '/upgrade-to-pro', destination: '/premium', permanent: false },
    ]
  },
  async rewrites() {
    return sb ? [{ source: '/sb/:path*', destination: `${sb}/:path*` }] : []
  },
}
