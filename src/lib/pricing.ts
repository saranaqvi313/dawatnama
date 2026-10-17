/** Premium price in whole rupees. Set PREMIUM_PRICE_PKR (server) and NEXT_PUBLIC_PREMIUM_PRICE_PKR (display) to the same value. */
export const PREMIUM_PRICE_PKR = Math.max(1, Math.round(Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_PKR) || 1499))
export const PRICE_LABEL = `Rs ${PREMIUM_PRICE_PKR.toLocaleString('en-PK')}`

/** The amount the server charges. Never taken from the browser. */
export function serverPrice(): number {
  return Math.max(1, Math.round(Number(process.env.PREMIUM_PRICE_PKR) || PREMIUM_PRICE_PKR))
}

/** Price of one card's share link, in whole rupees (separate from Premium). Set SHARE_PRICE_PKR and NEXT_PUBLIC_SHARE_PRICE_PKR. */
export const SHARE_PRICE_PKR = Math.max(1, Math.round(Number(process.env.NEXT_PUBLIC_SHARE_PRICE_PKR) || 100))
export const SHARE_PRICE_LABEL = `Rs ${SHARE_PRICE_PKR.toLocaleString('en-PK')}`

/** The amount the server charges for a share link. Never taken from the browser. */
export function serverSharePrice(): number {
  return Math.max(1, Math.round(Number(process.env.SHARE_PRICE_PKR) || SHARE_PRICE_PKR))
}
