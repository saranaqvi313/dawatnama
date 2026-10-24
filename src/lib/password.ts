/** Password rules for sign-in (used in the browser and on the server). */
export const PASSWORD_MIN = 10

export const PASSWORD_RULES = [
  { id: 'length', label: `At least ${PASSWORD_MIN} characters`, test: (p: string) => p.length >= PASSWORD_MIN },
  { id: 'letter', label: 'A letter (a–z)', test: (p: string) => /[A-Za-z]/.test(p) },
  { id: 'number', label: 'A number (0–9)', test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'A special character (e.g. ! @ # $ %)', test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
] as const

/** Returns '' if the password is strong enough, otherwise what is missing. */
export function passwordProblem(p: string): string {
  if (p.length > 72) return 'Use at most 72 characters.'
  const missing = PASSWORD_RULES.filter((r) => !r.test(p)).map((r) => r.label.toLowerCase())
  return missing.length ? `Your password needs: ${missing.join(', ')}.` : ''
}
