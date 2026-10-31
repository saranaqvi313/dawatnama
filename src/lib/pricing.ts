/**
 * Everything the site sells, in whole rupees. The server always charges these amounts; the
 * browser only displays them. Override a price with the env vars named in each product
 * (set the NEXT_PUBLIC_ one so the site shows the same price).
 */
/**
 * Free mode: everything is free (design tools, designer, guest links, card links) and the
 * payment pages are hidden. On by default. Set NEXT_PUBLIC_FREE_MODE=off in Vercel (and switch
 * it off in the database, see supabase/free_mode.sql) to start charging again.
 */
export const FREE_MODE = (process.env.NEXT_PUBLIC_FREE_MODE ?? 'on').toLowerCase() !== 'off'

export type ProductId = 'premium' | 'links1' | 'links5' | 'links20' | 'shaadi' | 'ai10' | 'ai30'
/** `credits` are guest links; `aiCredits` pay for AI designs and AI pictures (sold even in free mode). */
export type Product = { id: ProductId; name: string; price: number; credits: number; aiCredits: number; premium: boolean; blurb: string }

const env = (v: string | undefined, d: number) => Math.max(1, Math.round(Number(v) || d))

// Each env var is written out in full so Next.js can inline it in the browser bundle.
export const PRODUCTS: Record<ProductId, Product> = {
  premium: { id: 'premium', name: 'Premium design', credits: 0, aiCredits: 0, premium: true,
    price: env(process.env.NEXT_PUBLIC_PREMIUM_PRICE_PKR, 1499),
    blurb: 'Every design tool and the drag-and-drop designer, for all your cards. One time.' },
  links1: { id: 'links1', name: '1 guest link', credits: 1, aiCredits: 0, premium: false,
    price: env(process.env.NEXT_PUBLIC_SHARE_PRICE_PKR, 100),
    blurb: 'One personal link, e.g. your-site.com/ali-khan, addressed to that guest.' },
  links5: { id: 'links5', name: '5 guest links', credits: 5, aiCredits: 0, premium: false,
    price: env(process.env.NEXT_PUBLIC_PRICE_LINKS5_PKR, 400),
    blurb: 'Five personal links. Use them on any of your cards.' },
  links20: { id: 'links20', name: '20 guest links', credits: 20, aiCredits: 0, premium: false,
    price: env(process.env.NEXT_PUBLIC_PRICE_LINKS20_PKR, 1400),
    blurb: 'Twenty personal links for a bigger guest list.' },
  shaadi: { id: 'shaadi', name: 'Shaadi package', credits: env(process.env.NEXT_PUBLIC_SHAADI_LINKS, 50), aiCredits: 0, premium: true,
    price: env(process.env.NEXT_PUBLIC_PRICE_SHAADI_PKR, 3999),
    blurb: 'Premium design plus guest links for every function: Dholki, Mehndi, Nikah, Baraat and Walima.' },
  ai10: { id: 'ai10', name: '10 AI credits', credits: 0, aiCredits: 10, premium: false,
    price: env(process.env.NEXT_PUBLIC_PRICE_AI10_PKR, 299),
    blurb: 'AI card designs and AI pictures with Claude, GPT or Gemini. Credits never expire.' },
  ai30: { id: 'ai30', name: '30 AI credits', credits: 0, aiCredits: 30, premium: false,
    price: env(process.env.NEXT_PUBLIC_PRICE_AI30_PKR, 699),
    blurb: 'More AI designs and pictures for less per credit. Credits never expire.' },
}

export const AI_PACKS = [PRODUCTS.ai10, PRODUCTS.ai30]

export const PRODUCT_LIST = [PRODUCTS.links1, PRODUCTS.links5, PRODUCTS.links20, PRODUCTS.shaadi, PRODUCTS.premium]
export const isProductId = (v: string): v is ProductId => v in PRODUCTS
export const rupees = (n: number) => `Rs ${n.toLocaleString('en-PK')}`

// Older names kept for the pages that show them.
export const PREMIUM_PRICE_PKR = PRODUCTS.premium.price
export const PRICE_LABEL = rupees(PRODUCTS.premium.price)
export const SHARE_PRICE_PKR = PRODUCTS.links1.price
export const SHARE_PRICE_LABEL = rupees(PRODUCTS.links1.price)

/** Server-side price (PREMIUM_PRICE_PKR / SHARE_PRICE_PKR win if set without the NEXT_PUBLIC_ twin). */
export function serverPriceOf(id: ProductId): number {
  if (id === 'premium') return env(process.env.PREMIUM_PRICE_PKR, PRODUCTS.premium.price)
  if (id === 'links1') return env(process.env.SHARE_PRICE_PKR, PRODUCTS.links1.price)
  return PRODUCTS[id].price
}
export const serverPrice = () => serverPriceOf('premium')
export const serverSharePrice = () => serverPriceOf('links1')
