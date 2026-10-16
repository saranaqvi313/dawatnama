/** Decide whether a sign-in entry is a phone number or an email, and normalise it. */

export type Identity =
  | { kind: 'phone'; value: string; display: string }
  | { kind: 'email'; value: string; display: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Pakistani mobile numbers are accepted as 03001234567, 3001234567, 923001234567 or
 * +92 300 1234567 and normalised to E.164 (+923001234567). Other countries need a
 * leading + and country code.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim()
  const plus = trimmed.startsWith('+') || trimmed.startsWith('00')
  let digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('00')) digits = digits.slice(2)

  if (!plus) {
    if (/^03\d{9}$/.test(digits)) return `+92${digits.slice(1)}`
    if (/^3\d{9}$/.test(digits)) return `+92${digits}`
    if (/^923\d{9}$/.test(digits)) return `+${digits}`
    return null
  }
  if (digits.startsWith('92')) return /^923\d{9}$/.test(digits) ? `+${digits}` : null
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null
}

export function parseIdentity(raw: string, phoneEnabled: boolean): Identity | { error: string } {
  const v = raw.trim()
  if (!v) return { error: phoneEnabled ? 'Enter your phone number or email.' : 'Enter your email.' }
  if (v.includes('@')) {
    const email = v.toLowerCase()
    return EMAIL.test(email) ? { kind: 'email', value: email, display: email } : { error: 'That email address does not look right.' }
  }
  if (!phoneEnabled) return { error: 'Sign-in by phone is not available yet. Please use your email.' }
  const phone = normalizePhone(v)
  if (!phone) return { error: 'Enter a mobile number like 0300 1234567.' }
  const display = phone.startsWith('+92') ? `0${phone.slice(3, 6)} ${phone.slice(6)}` : phone
  return { kind: 'phone', value: phone, display }
}

export const phoneLoginEnabled = () => process.env.NEXT_PUBLIC_PHONE_LOGIN === 'on'
export const OTP_LENGTH = Math.min(10, Math.max(6, Number(process.env.NEXT_PUBLIC_OTP_LENGTH) || 6))
