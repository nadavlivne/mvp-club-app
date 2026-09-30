import 'server-only'
import type { Visit } from './tech'

// Database row → the Visit shape the tech app uses.
export type VisitRow = {
  id: string
  tech_id: string
  visit_date: string
  time_window: string
  kind: 'checkup' | 'service'
  season: 'spring' | 'fall' | null
  trade: string | null
  complaint: string | null
  customer: Visit['customer']
  address: string
  home_year: number | null
  equipment: Visit['equipment']
}

export const fromRow = (r: VisitRow): Visit => ({
  id: r.id,
  vanId: r.tech_id,
  window: r.time_window,
  kind: r.kind,
  season: r.season ?? undefined,
  trade: r.trade ?? undefined,
  complaint: r.complaint ?? undefined,
  customer: r.customer,
  address: r.address,
  homeYear: r.home_year ?? 0,
  equipment: r.equipment ?? [],
})

export const toRow = (v: Visit, techId: string, date: string) => ({
  tech_id: techId,
  visit_date: date,
  time_window: v.window,
  kind: v.kind,
  season: v.season ?? null,
  trade: v.trade ?? null,
  complaint: v.complaint ?? null,
  customer: v.customer,
  address: v.address,
  home_year: v.homeYear || null,
  equipment: v.equipment,
})

// Morning first: "8:00–10:00" before "1:30–3:30" (hours before 7 are afternoon).
export function byStartTime(a: { window: string }, b: { window: string }) {
  const start = (w: string) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(w)
    if (!m) return 99 * 60
    const h = Number(m[1])
    return (h < 7 ? h + 12 : h) * 60 + Number(m[2])
  }
  return start(a.window) - start(b.window)
}
