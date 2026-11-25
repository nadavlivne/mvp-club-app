import 'server-only'
import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { spamGuard } from '@/config/business'

// Protects the website sign-up form from bots, two ways:
// 1. A limit on new sign-ups from the same internet connection per hour (always on).
// 2. Cloudflare Turnstile, an invisible "are you human" check (on once Nadav adds the keys in Vercel:
//    NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY, from dash.cloudflare.com → Turnstile).
// We don't use a hidden "trap" field: phone autofill fills it and real people's leads were dropped.

export const turnstileOn = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY)

// The visitor's address, scrambled so the real one is never stored.
export async function visitorKey() {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  return createHash('sha256').update(`${process.env.SUPABASE_SECRET_KEY ?? ''}|${ip}`).digest('hex').slice(0, 32)
}

export async function passedTurnstile(token: string | undefined) {
  if (!turnstileOn) return true
  if (!token) return false
  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim()
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, ...(ip ? { remoteip: ip } : {}) }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (e) {
    // If Cloudflare can't be reached, let the person through rather than lose a real lead.
    console.error('turnstile check failed', e)
    return true
  }
}

export const tooManyMessage = 'We already got several sign-ups from this connection. Please call or text us and we will finish it with you.'
export const limits = spamGuard
