// Tech app: the visit data, the work a tech records on site, and the rules
// that decide when a check-up can be sent. Pure functions (no browser, no server).
import type { Rating } from '@/config/business'
import type { Customer, GuideRow } from './types'
import type { CheckupInput, EstimateInput } from './views'

export type Van = { id: string; name: string; tech: string }

export type Equipment = { id: string; type: string; brand: string; model: string; year: number | null; labelPhoto?: string }

export type Visit = {
  id: string
  vanId: string
  window: string
  kind: 'checkup' | 'service'
  season?: 'spring' | 'fall'
  trade?: string
  complaint?: string
  customer: Customer & { name: string }
  address: string
  homeYear: number
  equipment: Equipment[]
}

export type TechDay = { vans: Van[]; visits: Visit[] }

// What the tech records during the visit (saved on the device for now).
export type VisitWork = {
  equipment: Equipment[]
  // Per checklist area: marked OK, or one or more findings from the guide.
  areas: Record<string, { ok: boolean; findings: string[] }>
  // Per finding (guide id): what the customer sees, plus the photo.
  notes: Record<string, { title: string; note: string; photo?: string }>
  // Problems the guide doesn't cover: sent to the office for a quote, not to the customer.
  quoteRequests: { id: string; trade: string; description: string; photo?: string }[]
  // Service calls: the estimate the tech builds from the price book.
  estimate?: EstimateWork
  sentAt?: string
}

export type EstimateOptionWork = {
  key: string
  name: string
  what: string // short line; empty = built from the price book tasks
  why: string
  mostChosen: boolean
  codes: string[] // price book codes; a code listed twice means quantity 2
}

export type EstimateWork = {
  found: { title: string; detail: string; photo?: string }
  options: EstimateOptionWork[]
}

export const newEstimate = (): EstimateWork => ({ found: { title: '', detail: '' }, options: [] })

export const newWork = (v: Visit): VisitWork => ({ equipment: v.equipment, areas: {}, notes: {}, quoteRequests: [] })

// Trade order on the checklist. Keys match the "trade" column in the CSVs.
export const tradeOrder = ['HVAC', 'Plumbing', 'Electrical']

export type Area = { key: string; trade: string; area: string; howToCheck: string; rows: GuideRow[] }

export function checklistAreas(guide: GuideRow[]): Area[] {
  const areas = new Map<string, Area>()
  for (const g of guide) {
    const key = `${g.trade}|${g.area}`
    if (!areas.has(key)) areas.set(key, { key, trade: g.trade, area: g.area, howToCheck: g.howToCheck, rows: [] })
    areas.get(key)!.rows.push(g)
  }
  const ratingOrder: Rating[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN']
  for (const a of areas.values()) a.rows.sort((x, y) => ratingOrder.indexOf(x.rating) - ratingOrder.indexOf(y.rating))
  return [...areas.values()]
}

export const areaDone = (w: VisitWork, key: string) => {
  const a = w.areas[key]
  return !!a && (a.ok || a.findings.length > 0)
}

export function tradeProgress(w: VisitWork, areas: Area[], trade: string) {
  const list = areas.filter((a) => a.trade === trade)
  const done = list.filter((a) => areaDone(w, a.key)).length
  return { done, total: list.length, complete: done === list.length }
}

export const selectedFindings = (w: VisitWork) => Object.values(w.areas).flatMap((a) => a.findings)

export const defaultTitle = (g: GuideRow) => g.customerTitle || `${g.area}: ${g.recommend}`

// Why the check-up can't be sent yet (empty = ready). Rules from CLAUDE.md.
// Each blocker says where to fix it: the trade section and the element to scroll to.
export type Blocker = { text: string; trade: string; target: string }

export const areaTarget = (key: string) => `area-${key}`
export const findingTarget = (id: string) => `finding-${id}`

export function sendBlockers(w: VisitWork, areas: Area[], guide: Map<string, GuideRow>, tradeLabel: (t: string) => string): Blocker[] {
  const out: Blocker[] = []
  for (const t of tradeOrder) {
    const open = areas.filter((a) => a.trade === t && !areaDone(w, a.key))
    if (open.length) {
      out.push({
        text: `${tradeLabel(t)}: ${open.length} ${open.length === 1 ? 'area' : 'areas'} not checked yet (${open.map((a) => a.area).join(', ')})`,
        trade: t,
        target: areaTarget(open[0].key),
      })
    }
  }
  for (const id of selectedFindings(w)) {
    const g = guide.get(id)
    if (g?.rating === 'RED' && !w.notes[id]?.photo) {
      out.push({ text: `Red item needs a photo: ${w.notes[id]?.title || defaultTitle(g)}`, trade: g.trade, target: findingTarget(id) })
    }
  }
  return out
}

// The customer report input, built from what the tech recorded.
export function toCheckupInput(v: Visit, w: VisitWork, areas: Area[], guide: Map<string, GuideRow>, techName: string, today: string): CheckupInput {
  return {
    id: v.id,
    customer: v.customer,
    address: v.address,
    date: today,
    techName,
    findings: selectedFindings(w).map((id) => ({
      key: id,
      guideId: id,
      title: w.notes[id]?.title || defaultTitle(guide.get(id)!),
      techNote: w.notes[id]?.note || undefined,
      photo: w.notes[id]?.photo,
    })),
    checkedOk: areas.filter((a) => w.areas[a.key]?.ok).map((a) => a.area),
  }
}

// ---------- Service-call estimate ----------

// Price book lines a tech can put in an option (the service call itself is added automatically).
export const isPickable = (row: { category: string }) => row.category !== 'Diagnostic'

// The short "what's included" line: the tech's own words, or built from the price book tasks.
export function optionWhat(o: EstimateOptionWork, taskOf: (code: string) => string) {
  if (o.what.trim()) return o.what.trim()
  const counts = new Map<string, number>()
  for (const c of o.codes) counts.set(c, (counts.get(c) ?? 0) + 1)
  // Price book task names carry office notes like "(non-member)" that customers shouldn't see.
  const clean = (t: string) => t.replace(/\s*\(non-member\)/i, '')
  return [...counts].map(([c, n]) => (n > 1 ? `${clean(taskOf(c))} ×${n}` : clean(taskOf(c)))).join(', ')
}

// Why the estimate can't be sent yet (empty = ready). `target` is the element to scroll to.
export function estimateBlockers(e: EstimateWork | undefined): { text: string; target: string }[] {
  if (!e) return [{ text: 'Write what you found and add at least one option', target: 'est-found' }]
  const out: { text: string; target: string }[] = []
  if (!e.found.title.trim()) out.push({ text: 'Write what you found (the headline the customer sees)', target: 'est-found' })
  if (e.options.length === 0) out.push({ text: 'Add at least one option', target: 'est-add' })
  e.options.forEach((o, i) => {
    const label = o.name.trim() || `Option ${i + 1}`
    if (!o.name.trim()) out.push({ text: `Option ${i + 1} needs a name`, target: `est-${o.key}` })
    if (o.codes.length === 0) out.push({ text: `${label}: pick at least one item from the price book`, target: `est-${o.key}` })
  })
  return out
}

export function toEstimateInput(v: Visit, e: EstimateWork, techName: string, today: string, taskOf: (code: string) => string): EstimateInput {
  return {
    id: v.id,
    customer: v.customer,
    address: v.address,
    date: today,
    techName,
    trade: v.trade ?? 'HVAC',
    found: e.found,
    options: e.options.map((o) => ({
      key: o.key,
      name: o.name.trim(),
      what: optionWhat(o, taskOf),
      why: o.why.trim(),
      codes: o.codes,
      mostChosen: o.mostChosen,
    })),
  }
}
