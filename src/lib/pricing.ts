/**
 * Everything the site sells, in whole rupees. The server always charges these amounts; the
 * browser only displays them. Override a price with the env vars named in each product
 * (set the NEXT_PUBLIC_ one so the site shows the same price).
 */
export type ProductId = 'premium' | 'links1' | 'links5' | 'links20' | 'shaadi'
export type Product = { id: ProductId; name: string; price: number; credits: number; premium: boolean; blurb: string }

const env = (v: string | undefined, d: number) => Math.max(1, Math.round(Number(v) || d))

// Each env var is written out in full so Next.js can inline it in the browser bundle.
export const PRODUCTS: Record<ProductId, Product> = {
  premium: { id: 'premium', name: 'Premium design', credits: 0, premium: true,
    price: env(process.env.NEXT_PUBLIC_PREMIUM_PRICE_PKR, 1499),
    blurb: 'Every design tool and the drag-and-drop designer, for all your cards. One time.' },
  links1: { id: 'links1', name: '1 guest link', credits: 1, premium: false,
    price: env(process.env.NEXT_PUBLIC_SHARE_PRICE_PKR, 100),
    blurb: 'One personal link, e.g. your-site.com/ali-khan, addressed to that guest.' },
  links5: { id: 'links5', name: '5 guest links', credits: 5, premium: false,
    price: env(process.env.NEXT_PUBLIC_PRICE_LINKS5_PKR, 400),
    blurb: 'Five personal links. Use them on any of your cards.' },
  links20: { id: 'links20', name: '20 guest links', credits: 20, premium: false,
    price: env(process.env.NEXT_PUBLIC_PRICE_LINKS20_PKR, 1400),
    blurb: 'Twenty personal links for a bigger guest list.' },
  shaadi: { id: 'shaadi', name: 'Shaadi package', credits: env(process.env.NEXT_PUBLIC_SHAADI_LINKS, 50), premium: true,
    price: env(process.env.NEXT_PUBLIC_PRICE_SHAADI_PKR, 3999),
    blurb: 'Premium design plus guest links for every function: Dholki, Mehndi, Nikah, Baraat and Walima.' },
}

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
