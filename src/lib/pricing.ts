/** Premium price in whole rupees. Set PREMIUM_PRICE_PKR (server) and NEXT_PUBLIC_PREMIUM_PRICE_PKR (display) to the same value. */
export const PREMIUM_PRICE_PKR = Math.max(1, Math.round(Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_PKR) || 1499))
export const PRICE_LABEL = `Rs ${PREMIUM_PRICE_PKR.toLocaleString('en-PK')}`

/** The amount the server charges. Never taken from the browser. */
export function serverPrice(): number {
  return Math.max(1, Math.round(Number(process.env.PREMIUM_PRICE_PKR) || PREMIUM_PRICE_PKR))
}
