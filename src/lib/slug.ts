/** Card links look like  your-site.com/ali-khan . These helpers keep the name safe and unique-friendly. */

/** Addresses the site already uses; a card cannot take these. */
export const RESERVED_SLUGS = new Set([
  'i', 'api', 'auth', 'dashboard', 'design', 'login', 'logout', 'premium', 'preview', 'templates', 'admin',
  'about', 'help', 'faq', 'terms', 'privacy', 'contact', 'pricing', 'signin', 'signup', 'account', 'settings',
  'static', 'public', 'assets', 'images', 'favicon', 'robots', 'sitemap', 'manifest', 'www', 'app', 'dawatnama',
  'cards', 'refund-policy', 'refund', 'guests', 'plans', 'opengraph-image', 'twitter-image', 'icon', 'apple-icon', 'error', 'not-found',
])

export const SLUG_MIN = 3
export const SLUG_MAX = 40

/** "Ali Khan & Family!" -> "ali-khan-family". Latin letters, digits and single hyphens only. */
export function toSlug(text: string): string {
  return text
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '')
}

/** Returns an error message, or '' when the link name can be used. */
export function slugProblem(slug: string): string {
  if (slug.length < SLUG_MIN) return `Use at least ${SLUG_MIN} letters or numbers (English letters, e.g. ali-khan).`
  if (slug.length > SLUG_MAX) return `Keep it under ${SLUG_MAX} characters.`
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return 'Use English letters, numbers and hyphens only, e.g. ali-khan.'
  if (RESERVED_SLUGS.has(slug)) return 'That name is used by the website. Please pick another.'
  return ''
}

export const isPossibleSlug = (s: string) => s.length <= 80 && /^[a-z0-9-]+$/.test(s) && !RESERVED_SLUGS.has(s)
