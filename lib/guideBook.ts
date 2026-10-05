import 'server-only'
import { loadInspectionGuide } from './data'
import { supabaseConfigured } from './supabase/config'
import { adminClient } from './supabase/server'
import type { Rating } from '@/config/business'
import type { GuideRow } from './types'

// The check-up checklist (Inspection Guide): one Google Sheet tab per trade, read with the price list.
export const GUIDE_COLUMNS = [
  'id',
  'trade',
  'area',
  'how_to_check',
  'finding',
  'rating',
  'recommend',
  'pricebook_code',
  'customer_title',
  'customer_message',
  'who_can_check',
] as const
export const CHECKLIST_TABS = { Electrical: 'Check-up Electrical', HVAC: 'Check-up HVAC', Plumbing: 'Check-up Plumbing' } as const
const RATINGS: Rating[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN']

type DbRow = {
  id: string
  sort: number
  trade: string
  area: string
  how_to_check: string
  finding: string
  rating: Rating
  recommend: string
  pricebook_code: string
  customer_title: string
  customer_message: string
  who_can_check: string
}

const fromDb = (r: DbRow): GuideRow => ({
  id: r.id,
  trade: r.trade,
  area: r.area,
  howToCheck: r.how_to_check,
  whoCanCheck: r.who_can_check,
  finding: r.finding,
  rating: r.rating,
  recommend: r.recommend,
  pricebookCode: r.pricebook_code,
  customerTitle: r.customer_title,
  customerMessage: r.customer_message,
})

// The checklist in use: the published one in the database, or the file until then.
export async function liveGuide(): Promise<Map<string, GuideRow>> {
  if (supabaseConfigured && process.env.SUPABASE_SECRET_KEY) {
    const { data, error } = await adminClient().from('inspection_guide').select('*').order('sort').returns<DbRow[]>()
    if (!error && data && data.length) return new Map(data.map((r) => [r.id, fromDb(r)]))
  }
  return loadInspectionGuide()
}

export async function guideSource(): Promise<'database' | 'file'> {
  if (!supabaseConfigured || !process.env.SUPABASE_SECRET_KEY) return 'file'
  const { count, error } = await adminClient().from('inspection_guide').select('id', { count: 'exact', head: true })
  return !error && count ? 'database' : 'file'
}

// Checks the checklist rows. `priceCodes` = codes in the (new) price list.
export function checkGuideRows(raw: Record<string, string>[], priceCodes: Set<string>): { rows: GuideRow[]; errors: string[] } {
  const errors: string[] = []
  if (!raw.length) return { rows: [], errors: ['The check-up tabs have no rows.'] }
  const rows: GuideRow[] = []
  const seen = new Set<string>()
  const lastHow = new Map<string, string>()
  raw.forEach((r, i) => {
    const id = (r.id ?? '').trim().toUpperCase()
    const line = `${r._where ?? `Row ${i + 2}`}${id ? ` (${id})` : ''}`
    if (!id) return errors.push(`${line}: id is empty.`)
    if (seen.has(id)) return errors.push(`${line}: id ${id} appears twice.`)
    seen.add(id)
    if (r._tab && r.trade && r.trade !== r._tab) errors.push(`${line}: trade says ${r.trade}, but the row is on the ${r._tab} check-up tab.`)
    if (!['Electrical', 'HVAC', 'Plumbing'].includes(r.trade)) errors.push(`${line}: trade must be Electrical, HVAC or Plumbing (found "${r.trade}").`)
    const rating = (r.rating ?? '').trim().toUpperCase() as Rating
    if (!RATINGS.includes(rating)) errors.push(`${line}: rating must be RED, ORANGE, YELLOW or GREEN (found "${r.rating}").`)
    for (const f of ['area', 'finding', 'customer_title', 'customer_message'] as const) if (!r[f]?.trim()) errors.push(`${line}: ${f} is empty.`)
    const code = (r.pricebook_code ?? '').trim()
    const codeUp = code.toUpperCase()
    if (code && codeUp !== 'QUOTE' && !priceCodes.has(codeUp)) errors.push(`${line}: pricebook_code ${code} is not in the price list.`)
    // "Same" in how_to_check = the same as the row above in this area ("Same; …" adds to it).
    const key = `${r.trade}|${r.area}`
    const how = (r.how_to_check ?? '').trim()
    const resolved = /^same\b/i.test(how) ? (lastHow.get(key) ?? '') + how.slice(4) : how
    lastHow.set(key, resolved)
    rows.push({
      id,
      trade: r.trade,
      area: r.area.trim(),
      howToCheck: resolved,
      whoCanCheck: r.who_can_check?.trim() || 'Any trained tech',
      finding: r.finding.trim(),
      rating,
      recommend: (r.recommend ?? '').trim(),
      pricebookCode: codeUp === 'QUOTE' ? 'Quote' : codeUp,
      customerTitle: r.customer_title.trim(),
      customerMessage: r.customer_message.trim(),
    })
  })
  return { rows, errors }
}

export type GuideChanges = {
  added: { code: string; task: string }[]
  removed: { code: string; task: string }[]
  changed: { code: string; task: string; fields: { field: string; from: string; to: string }[] }[]
}
const FIELDS: [keyof GuideRow, string][] = [
  ['rating', 'Rating'],
  ['pricebookCode', 'Price code'],
  ['customerTitle', 'Customer title'],
  ['customerMessage', 'Customer message'],
  ['finding', 'Finding'],
  ['area', 'Area'],
  ['howToCheck', 'How to check'],
  ['recommend', 'Recommend'],
  ['trade', 'Trade'],
  ['whoCanCheck', 'Who can check'],
]

export function diffGuides(current: Map<string, GuideRow>, next: GuideRow[]): GuideChanges & { reordered: boolean } {
  const out: GuideChanges = { added: [], removed: [], changed: [] }
  const nextIds = new Set(next.map((r) => r.id))
  for (const r of next) {
    const old = current.get(r.id)
    if (!old) {
      out.added.push({ code: r.id, task: r.customerTitle })
      continue
    }
    const fields = FIELDS.filter(([k]) => String(old[k] ?? '') !== String(r[k] ?? '')).map(([k, label]) => ({ field: label, from: String(old[k] ?? ''), to: String(r[k] ?? '') }))
    if (fields.length) out.changed.push({ code: r.id, task: r.customerTitle, fields })
  }
  for (const [id, r] of current) if (!nextIds.has(id)) out.removed.push({ code: id, task: r.customerTitle })
  const reordered = [...current.keys()].filter((id) => nextIds.has(id)).join() !== next.filter((r) => current.has(r.id)).map((r) => r.id).join()
  return { ...out, reordered }
}

export async function publishGuide(rows: GuideRow[], changes: GuideChanges, by: { id: string; name: string }, source: string) {
  const db = adminClient()
  const now = new Date().toISOString()
  const { error } = await db.from('inspection_guide').upsert(
    rows.map((r, i) => ({
      id: r.id,
      sort: i,
      trade: r.trade,
      area: r.area,
      how_to_check: r.howToCheck,
      finding: r.finding,
      rating: r.rating,
      recommend: r.recommend,
      pricebook_code: r.pricebookCode,
      customer_title: r.customerTitle,
      customer_message: r.customerMessage,
      who_can_check: r.whoCanCheck,
      updated_at: now,
    })),
  )
  if (error) throw new Error(error.message)
  const keep = new Set(rows.map((r) => r.id))
  const { data: existing } = await db.from('inspection_guide').select('id')
  const gone = (existing ?? []).map((r) => r.id as string).filter((id) => !keep.has(id))
  if (gone.length) await db.from('inspection_guide').delete().in('id', gone)
  await db.from('price_book_versions').insert({ kind: 'checklist', published_by: by.id || null, published_by_name: by.name, file_name: source, row_count: rows.length, changes })
}

// Excel tabs for the checklist (one per trade), in the sheet's column order.
export function guideSheets(rows: GuideRow[]) {
  const header = GUIDE_COLUMNS.map((c) => ({ value: c as string, fontWeight: 'bold' as const }))
  return (Object.entries(CHECKLIST_TABS) as [string, string][]).map(([trade, tab]) => ({
    sheet: tab,
    stickyRowsCount: 1,
    columns: [{ width: 8 }, { width: 11 }, { width: 18 }, { width: 40 }, { width: 44 }, { width: 9 }, { width: 34 }, { width: 13 }, { width: 34 }, { width: 60 }, { width: 16 }],
    data: [
      header,
      ...rows
        .filter((r) => r.trade === trade)
        .map((r) => [r.id, r.trade, r.area, r.howToCheck, r.finding, r.rating, r.recommend, r.pricebookCode, r.customerTitle, r.customerMessage, r.whoCanCheck].map((v) => ({ value: v ?? '' }))),
    ],
  }))
}
