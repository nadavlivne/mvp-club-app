import 'server-only'
import { checkupSeasonFor, nearbyCheckup as N, visitSlots } from '@/config/business'
import { site } from '@/config/site'
import { loadZipPoints } from './data'
import { adminClient } from './supabase/server'
import { todayET } from './supabase/config'

// "Nearby check-up": when a job is booked, find members close by who are due for a check-up
// and draft a text offering them a slot on the same trip.
// Distances are zip code to zip code (centre of each zip), good enough to fill a route.
// Until Housecall Pro is connected, members are the leads marked "Joined" and check-up history
// comes from our own check-up visits (matched by street address).

export type Anchor = { id: string; date: string; window: string; kind: string; customer: string; address: string; zip: string | null; van: string }
export type Candidate = {
  leadId: string
  name: string
  firstName: string
  phone: string
  address: string
  zip: string
  miles: number
  lastCheckup: string | null
  lastOffer: string | null
}

// The zip code in an address, looked for after the street part so a house number like 10500 isn't taken for one.
export const zipOf = (address: string) => {
  const rest = address.includes(',') ? address.slice(address.indexOf(',')) : ''
  const all = [...rest.matchAll(/\b(\d{5})(?:-\d{4})?\b/g)].map((m) => m[1])
  return all.at(-1) ?? null
}
// "123 Main St., Apt 2, Cincinnati OH 45202" → "123 main st"
export const streetKey = (address: string) =>
  address
    .split(',')[0]
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd|place|pl)\b/g, (w) => w.slice(0, 2))
    .replace(/\s+/g, ' ')
    .trim()

function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const addDays = (ymd: string, n: number) => {
  const d = new Date(ymd + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

type LeadRow = { id: string; first_name: string; last_name: string; phone: string; street: string; city: string; zip: string }
type VisitRow = { id: string; visit_date: string; time_window: string; kind: string; address: string; customer: { name: string }; techs: { van: string } | null }

export async function loadNearby(daysAhead = 14) {
  const db = adminClient()
  const today = todayET()
  const [members, visits, offers] = await Promise.all([
    db.from('leads').select('id, first_name, last_name, phone, street, city, zip').eq('status', 'joined').returns<LeadRow[]>(),
    db
      .from('visits')
      .select('id, visit_date, time_window, kind, address, customer, techs(van)')
      .gte('visit_date', addDays(today, -400))
      .returns<VisitRow[]>(),
    db.from('nearby_offers').select('member_lead_id, created_at').gte('created_at', addDays(today, -N.reofferAfterDays) + 'T00:00:00Z').returns<{ member_lead_id: string; created_at: string }[]>(),
  ])
  const points = loadZipPoints()
  const all = visits.data ?? []

  // Check-up history and already-booked check-ups, by street address.
  const lastCheckup = new Map<string, string>()
  const booked = new Set<string>()
  for (const v of all.filter((x) => x.kind === 'checkup')) {
    const k = streetKey(v.address)
    if (v.visit_date > today) booked.add(k)
    else if ((lastCheckup.get(k) ?? '') < v.visit_date) lastCheckup.set(k, v.visit_date)
  }
  const lastOffer = new Map<string, string>()
  for (const o of offers.data ?? []) if ((lastOffer.get(o.member_lead_id) ?? '') < o.created_at) lastOffer.set(o.member_lead_id, o.created_at)

  const dueBefore = addDays(today, -N.dueAfterDays)
  const due = (members.data ?? [])
    .map((m) => ({ m, k: streetKey(m.street), p: points.get(m.zip) }))
    .filter(({ k, p }) => p && !booked.has(k) && (lastCheckup.get(k) ?? '') <= dueBefore)

  const anchors: Anchor[] = all
    .filter((v) => v.visit_date >= today && v.visit_date <= addDays(today, daysAhead))
    .sort((a, b) => (a.visit_date + a.time_window).localeCompare(b.visit_date + b.time_window))
    .map((v) => ({ id: v.id, date: v.visit_date, window: v.time_window, kind: v.kind, customer: v.customer?.name ?? '', address: v.address, zip: zipOf(v.address), van: v.techs?.van ?? '' }))

  // Members due near a zip code, closest first (skipping the booked home itself).
  function near(zip: string | null, skipAddress = ''): Candidate[] {
    const here = zip ? points.get(zip) : undefined
    if (!here) return []
    const skip = streetKey(skipAddress)
    return due
      .filter(({ k }) => !skip || k !== skip)
      .map(({ m, k, p }) => ({
        leadId: m.id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        firstName: m.first_name,
        phone: m.phone,
        address: [m.street, m.city, m.zip].filter(Boolean).join(', '),
        zip: m.zip,
        miles: Math.round(miles(here, p!) * 10) / 10,
        lastCheckup: lastCheckup.get(k) ?? null,
        lastOffer: lastOffer.get(m.id) ?? null,
      }))
      .filter((c) => c.miles <= N.radiusMiles)
      .sort((a, b) => a.miles - b.miles)
  }

  return { anchors, near, setupMissing: !!offers.error, knownZip: (z: string) => points.has(z), memberCount: (members.data ?? []).length }
}

// The text the office sends (they can edit it before sending).
export function offerText(firstName: string, date: string, window: string) {
  const d = new Date(date + 'T12:00:00')
  const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const slot = visitSlots.find((s) => s.label === window || s.id === window)?.short ?? (window ? window.toLowerCase() : '')
  const season = checkupSeasonFor(d)
  return (
    `Hi ${firstName || 'there'}, it's MVP Club. Our tech will be in your neighborhood on ${day}${slot ? ` (${slot})` : ''}. ` +
    `Want us to do your ${season} check-up while we're there? Reply YES and we'll confirm a time. ` +
    `Questions: ${site.phoneDisplay}`
  )
}
