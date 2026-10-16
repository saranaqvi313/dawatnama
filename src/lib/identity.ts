/** Phone-number sign-in helpers. */

export type Phone = { value: string; display: string }

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

export function parsePhone(raw: string): Phone | { error: string } {
  const v = raw.trim()
  if (!v) return { error: 'Enter your mobile number.' }
  if (v.includes('@')) return { error: 'Please enter a mobile number, not an email.' }
  const phone = normalizePhone(v)
  if (!phone) return { error: 'Enter a mobile number like 0300 1234567.' }
  const display = phone.startsWith('+92') ? `0${phone.slice(3, 6)} ${phone.slice(6)}` : phone
  return { value: phone, display }
}

export const OTP_LENGTH = Math.min(10, Math.max(6, Number(process.env.NEXT_PUBLIC_OTP_LENGTH) || 6))
