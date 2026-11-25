import 'server-only'
import { adminClient } from './supabase/server'
import { dateET } from './staff'
import { weeklyBonus, type BonusBreakdown } from './bonusMath'

export type VanWeek = {
  van: string
  techs: string[]
  revenueEntered: boolean
  note: string
  enteredBy: string
  bonus: BonusBreakdown
  items: { customer: string; title: string; tech: string }[]
}

const addDays = (ymd: string, n: number) => {
  const d = new Date(ymd + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// The Mondays to choose from: this week and the weeks before it.
export function recentWeeks(monday: string, count = 8) {
  return Array.from({ length: count }, (_, i) => addDays(monday, -7 * i))
}

export const weekLabel = (monday: string) => {
  const f = (ymd: string) => new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${f(monday)} – ${f(addDays(monday, 6))}`
}
export const payday = (monday: string) =>
  new Date(addDays(monday, 11) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

type ApprovalRow = {
  created_at: string
  details: { items?: { title: string }[] }
  customer_links: { kind: string; visits: { customer: { name: string }; techs: { name: string; van: string } | null } }
}

// Bonus for every van in one week (Mon–Sun). `onlyVan` limits it to one van (tech app).
export async function bonusWeek(monday: string, onlyVan?: string): Promise<{ vans: VanWeek[]; setupMissing: boolean }> {
  const db = adminClient()
  const sunday = addDays(monday, 6)
  // A day either side, then filtered by the Cincinnati date, so time zones can't move a job to the wrong week.
  const from = addDays(monday, -1) + 'T00:00:00Z'
  const to = addDays(sunday, 2) + 'T00:00:00Z'
  const [techs, revenue, approvals] = await Promise.all([
    db.from('techs').select('name, van, active').returns<{ name: string; van: string; active: boolean }[]>(),
    db.from('van_week_revenue').select('van, revenue, note, entered_by').eq('week_start', monday).returns<{ van: string; revenue: number; note: string; entered_by: string }[]>(),
    db
      .from('approvals')
      .select('created_at, details, customer_links!inner(kind, visits!inner(customer, techs(name, van)))')
      .eq('customer_links.kind', 'report')
      .gte('created_at', from)
      .lt('created_at', to)
      .returns<ApprovalRow[]>(),
  ])

  // Report items sold this week, credited to the van of the tech who did the check-up.
  const sold = new Map<string, VanWeek['items']>()
  for (const a of approvals.data ?? []) {
    const day = dateET(a.created_at)
    if (day < monday || day > sunday) continue
    const v = a.customer_links.visits
    const van = v.techs?.van || 'No van'
    const list = sold.get(van) ?? []
    for (const i of a.details.items ?? []) list.push({ customer: v.customer.name, title: i.title, tech: v.techs?.name ?? '' })
    sold.set(van, list)
  }

  const rev = new Map((revenue.data ?? []).map((r) => [r.van, r]))
  const activeTechs = (techs.data ?? []).filter((t) => t.active && t.van)
  const vanNames = [...new Set([...activeTechs.map((t) => t.van), ...rev.keys(), ...sold.keys()])]
    .filter((v) => !onlyVan || v === onlyVan)
    .sort()

  const vans = vanNames.map<VanWeek>((van) => {
    const r = rev.get(van)
    const items = sold.get(van) ?? []
    return {
      van,
      techs: activeTechs.filter((t) => t.van === van).map((t) => t.name),
      revenueEntered: !!r,
      note: r?.note ?? '',
      enteredBy: r?.entered_by ?? '',
      bonus: weeklyBonus(Number(r?.revenue ?? 0), items.length),
      items,
    }
  })
  return { vans, setupMissing: !!revenue.error }
}
