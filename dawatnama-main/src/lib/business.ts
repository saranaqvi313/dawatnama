/** Business details shown on the legal and contact pages (and needed for Safepay's live approval). */
export const BUSINESS = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Dawatnama',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || 'Islamabad, Pakistan',
  city: 'Islamabad',
  updated: '17 October 2026',
}
export const missing = (v: string) => !v
