/** One-time sign-in codes sent by SMS. Server-only. */
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from './supabase/admin'

export const CODE_LENGTH = 6
const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_AFTER_MS = 60 * 1000
const MAX_SENDS_PER_HOUR = 5
const MAX_ATTEMPTS = 5

/**
 * Which SMS service sends the codes (OTP_PROVIDER):
 *  - "textbee": your own Android phone + SIM via textbee.dev (needs TEXTBEE_API_KEY)
 *  - "demo":    no SMS; the code is shown on screen. Never allowed on the live (production) site.
 */
export function otpProvider(): 'textbee' | 'demo' | 'off' {
  const p = (process.env.OTP_PROVIDER || '').toLowerCase()
  if (p === 'demo' && process.env.VERCEL_ENV !== 'production') return 'demo'
  if (p === 'textbee' && process.env.TEXTBEE_API_KEY) return 'textbee'
  return 'off'
}

function secret() {
  const key = process.env.LOGIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return key
}

export function hashCode(phone: string, code: string) {
  return createHmac('sha256', secret()).update(`otp:${phone}:${code}`).digest('hex')
}

export function newCode() {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0')
}

async function sendSms(phone: string, text: string) {
  const res = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.TEXTBEE_API_KEY! },
    body: JSON.stringify({ recipients: [phone], message: text, ...(process.env.TEXTBEE_DEVICE_ID ? { deviceId: process.env.TEXTBEE_DEVICE_ID } : {}) }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`SMS service answered ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
}

export type SendResult = { ok: true; demoCode?: string } | { ok: false; status: number; error: string }

/** Creates a fresh code for this number and sends it. Rate-limited per number. */
export async function sendLoginCode(phone: string): Promise<SendResult> {
  const provider = otpProvider()
  if (provider === 'off') return { ok: false, status: 503, error: 'Sign-in codes are not set up on this site yet.' }
  const admin = createAdminClient()
  const { data: row } = await admin.from('login_codes').select('last_sent_at, window_start, sends_in_window').eq('phone', phone).maybeSingle()
  const now = Date.now()
  if (row && now - new Date(row.last_sent_at).getTime() < RESEND_AFTER_MS) {
    return { ok: false, status: 429, error: 'Please wait a minute before asking for another code.' }
  }
  const sameWindow = row && now - new Date(row.window_start).getTime() < 60 * 60 * 1000
  if (sameWindow && row.sends_in_window >= MAX_SENDS_PER_HOUR) {
    return { ok: false, status: 429, error: 'Too many codes for this number. Please try again in an hour.' }
  }
  const code = newCode()
  const { error } = await admin.from('login_codes').upsert({
    phone, code_hash: hashCode(phone, code), expires_at: new Date(now + CODE_TTL_MS).toISOString(), attempts: 0,
    sends_in_window: sameWindow ? row.sends_in_window + 1 : 1,
    window_start: sameWindow ? row.window_start : new Date(now).toISOString(),
    last_sent_at: new Date(now).toISOString(),
  })
  if (error) throw new Error(`Could not store code: ${error.message}`)
  if (provider === 'demo') return { ok: true, demoCode: code }
  await sendSms(phone, `${code} is your Dawatnama sign-in code. It expires in 10 minutes. Do not share it with anyone.`)
  return { ok: true }
}

/** Checks a code. Each code works once, for 10 minutes, with at most 5 tries. */
export async function checkLoginCode(phone: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) return { ok: false, error: `Enter the ${CODE_LENGTH}-digit code.` }
  const admin = createAdminClient()
  const { data: row } = await admin.from('login_codes').select('code_hash, expires_at, attempts').eq('phone', phone).maybeSingle()
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: 'That code has expired. Ask for a new one.' }
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Too many wrong tries. Ask for a new code.' }
  await admin.from('login_codes').update({ attempts: row.attempts + 1 }).eq('phone', phone)
  const a = Buffer.from(hashCode(phone, code), 'hex')
  const b = Buffer.from(String(row.code_hash), 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, error: 'That code is wrong. Check the SMS and try again.' }
  await admin.from('login_codes').delete().eq('phone', phone)
  return { ok: true }
}
