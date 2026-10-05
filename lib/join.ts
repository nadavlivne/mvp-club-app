import 'server-only'
import { membership, membershipPrice } from '@/config/business'
import { site } from '@/config/site'
import { loadServiceArea } from './data'

// Shared by the website sign-up (/join) and the sign-up on the tech's tablet.

export type JoinData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  street: string
  city: string
  zip: string
  systems: number
  plan: 'monthly' | 'yearly'
  preferredTime: string
  notes: string
}
export type JoinResult = { ok: true; inArea?: boolean } | { ok: false; error: string }

export const SAVE_ERROR = `Sorry, we couldn't save that. Please try again, or call or text ${site.phoneDisplay}.`
const digits = (s: string) => s.replace(/\D/g, '')
const clip = (s: unknown, n = 200) => String(s ?? '').trim().slice(0, n)

export function checkJoin(step: number, d: JoinData): string | null {
  if (step >= 1) {
    if (!clip(d.firstName) || !clip(d.lastName)) return 'Please enter your first and last name.'
    const p = digits(d.phone)
    if (!(p.length === 10 || (p.length === 11 && p.startsWith('1')))) return 'Please enter a 10-digit mobile number.'
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return 'That email doesn’t look right.'
  }
  if (step >= 2) {
    if (!clip(d.street) || !clip(d.city)) return 'Please enter your street address and city.'
    if (digits(d.zip).length !== 5) return 'Please enter your 5-digit zip code.'
    if (!(d.systems >= 1 && d.systems <= membership.maxSystems)) return 'Please choose how many heating & cooling systems you have.'
  }
  if (step >= 3 && d.plan !== 'monthly' && d.plan !== 'yearly') return 'Please choose monthly or yearly.'
  return null
}

export function joinRow(step: number, d: JoinData) {
  const p = digits(d.phone).slice(-10)
  const out: Record<string, unknown> = {
    step,
    updated_at: new Date().toISOString(),
    first_name: clip(d.firstName, 80),
    last_name: clip(d.lastName, 80),
    phone: `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`,
    email: clip(d.email, 160).toLowerCase(),
  }
  if (step >= 2) {
    const zip = digits(d.zip).slice(0, 5)
    Object.assign(out, {
      street: clip(d.street),
      city: clip(d.city, 80),
      zip,
      in_area: loadServiceArea(site.serviceRadiusMiles).some((a) => a.zip === zip),
      systems: d.systems,
    })
  }
  if (step >= 3) Object.assign(out, { plan: d.plan, price: membershipPrice(d.plan, d.systems) })
  if (step >= 4) Object.assign(out, { preferred_time: clip(d.preferredTime, 80), notes: clip(d.notes, 1000) })
  return out
}

export const validSignature = (s: string | null): s is string => !!s && s.startsWith('data:image/png;base64,') && s.length < 400_000
