import 'server-only'
import readXlsx from 'read-excel-file/node'
import writeXlsx from 'write-excel-file/node'
import { PRICE_SHEET_HOW_TO } from './priceSheetHowTo'
import { CHECKLIST_TABS, GUIDE_COLUMNS, checkGuideRows, diffGuides, guideSheets, guideSource, liveGuide, publishGuide } from './guideBook'
import { serviceCallCode } from '@/config/business'
import { parseCsv } from './csv'
import { loadPriceBook } from './data'
import { supabaseConfigured } from './supabase/config'
import { adminClient } from './supabase/server'
import type { GuideRow, PriceBookRow } from './types'

// The columns of the price list file (same as data/pricebook.csv).
export const PRICE_COLUMNS = ['code', 'trade', 'category', 'task', 'est_hours', 'standard_price', 'member_price', 'rate_type', 'credit_tier', 'notes'] as const

type DbRow = {
  code: string
  trade: string
  category: string
  task: string
  est_hours: string
  standard_price: number
  member_price: number
  rate_type: 'Service' | 'Install'
  credit_tier: string
  notes: string
}

const fromDb = (r: DbRow): PriceBookRow => ({
  code: r.code,
  trade: r.trade,
  category: r.category,
  task: r.task,
  estHours: r.est_hours,
  standardPrice: Number(r.standard_price),
  memberPrice: Number(r.member_price),
  rateType: r.rate_type,
  creditTier: r.credit_tier,
  notes: r.notes,
})

const toDb = (r: PriceBookRow): DbRow => ({
  code: r.code,
  trade: r.trade,
  category: r.category,
  task: r.task,
  est_hours: r.estHours ?? '',
  standard_price: r.standardPrice,
  member_price: r.memberPrice,
  rate_type: r.rateType,
  credit_tier: r.creditTier,
  notes: r.notes,
})

// The price list in use: the published one in the database, or the file until then.
export async function livePriceBook(): Promise<Map<string, PriceBookRow>> {
  if (supabaseConfigured && process.env.SUPABASE_SECRET_KEY) {
    const { data, error } = await adminClient().from('price_book').select('*').returns<DbRow[]>()
    if (!error && data && data.length) return new Map(data.map((r) => [r.code, fromDb(r)]))
  }
  return loadPriceBook()
}

export async function priceBookSource(): Promise<'database' | 'file'> {
  if (!supabaseConfigured || !process.env.SUPABASE_SECRET_KEY) return 'file'
  const { count, error } = await adminClient().from('price_book').select('code', { count: 'exact', head: true })
  return !error && count ? 'database' : 'file'
}

// ---------- Reading an uploaded file ----------

const norm = (h: string) => h.trim().toLowerCase().replace(/[\s-]+/g, '_')

export async function readPriceFile(fileName: string, bytes: Buffer): Promise<Record<string, string>[]> {
  if (/\.xlsx$/i.test(fileName)) {
    const sheets = await readXlsx(bytes)
    // One tab per trade (Electrical / HVAC / Plumbing) if the file has them, otherwise the first tab.
    const tradeTabs = sheets.filter((s) => (TRADE_TABS as readonly string[]).includes(s.sheet))
    const use = tradeTabs.length ? tradeTabs : sheets.slice(0, 1)
    return use.flatMap((sheet) => {
      const [header, ...body] = (sheet.data ?? []) as unknown[][]
      const keys = (header ?? []).map((h) => norm(String(h ?? '')))
      return body
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.some((c) => c !== null && String(c).trim() !== ''))
        .map(({ r, i }) => ({
          ...Object.fromEntries(keys.map((k, j) => [k, r[j] === null || r[j] === undefined ? '' : String(r[j]).trim()])),
          ...(tradeTabs.length ? { _tab: sheet.sheet, _where: `${sheet.sheet} tab, row ${i + 2}` } : {}),
        }))
    })
  }
  if (/\.csv$/i.test(fileName)) {
    return parseCsv(bytes.toString('utf8').replace(/^﻿/, '')).map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [norm(k), v])),
    )
  }
  throw new Error('Please upload the price list as an Excel (.xlsx) or CSV file.')
}

// ---------- Checking it ----------

const money = (s: string) => {
  const n = Number(String(s).replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

export function checkPriceRows(raw: Record<string, string>[], guide: GuideRow[]): { rows: PriceBookRow[]; errors: string[] } {
  const errors: string[] = []
  const first = raw[0] ?? {}
  const missing = PRICE_COLUMNS.filter((c) => !(c in first))
  if (!raw.length) return { rows: [], errors: ['The file has no rows.'] }
  if (missing.length) return { rows: [], errors: [`Missing columns: ${missing.join(', ')}. Start from "Download current price list" so the columns stay the same.`] }

  const rows: PriceBookRow[] = []
  const seen = new Set<string>()
  raw.forEach((r, i) => {
    const line = `${r._where ?? `Row ${i + 2}`}${r.code ? ` (${r.code})` : ''}`
    if (r._tab && r.trade && r.trade !== r._tab) errors.push(`${line}: trade says ${r.trade}, but the row is on the ${r._tab} tab.`)
    const code = r.code.trim().toUpperCase()
    if (!code) return errors.push(`${line}: code is empty.`)
    if (seen.has(code)) return errors.push(`${line}: code ${code} appears twice.`)
    seen.add(code)
    const standard = money(r.standard_price)
    const member = money(r.member_price)
    if (Number.isNaN(standard) || standard < 0) errors.push(`${line}: standard_price "${r.standard_price}" is not a price.`)
    if (Number.isNaN(member) || member < 0) errors.push(`${line}: member_price "${r.member_price}" is not a price.`)
    if (!Number.isNaN(standard) && !Number.isNaN(member) && member > standard) errors.push(`${line}: member price ($${member}) is higher than the regular price ($${standard}).`)
    if (!['Service', 'Install'].includes(r.rate_type)) errors.push(`${line}: rate_type must be Service or Install (found "${r.rate_type}").`)
    if (!['', 'Small', 'Medium', 'Large'].includes(r.credit_tier)) errors.push(`${line}: credit_tier must be empty, Small, Medium or Large (found "${r.credit_tier}").`)
    if (!['Electrical', 'HVAC', 'Plumbing'].includes(r.trade)) errors.push(`${line}: trade must be Electrical, HVAC or Plumbing (found "${r.trade}").`)
    if (!r.task) errors.push(`${line}: task is empty.`)
    rows.push({
      code,
      trade: r.trade,
      category: r.category,
      task: r.task,
      estHours: r.est_hours,
      standardPrice: standard,
      memberPrice: member,
      rateType: r.rate_type as 'Service' | 'Install',
      creditTier: r.credit_tier,
      notes: r.notes,
    })
  })
  // Codes the app depends on.
  for (const [trade, code] of Object.entries(serviceCallCode)) if (!seen.has(code)) errors.push(`${code} (${trade} service call) is missing — the app needs it.`)
  const used = [...new Set(guide.map((g) => g.pricebookCode).filter((c) => c && c !== 'Quote'))]
  for (const c of used) if (!seen.has(c)) errors.push(`${c} is missing, but the Inspection Guide uses it (${guide.filter((g) => g.pricebookCode === c).map((g) => g.id).join(', ')}).`)
  return { rows, errors }
}

// ---------- What changes ----------

export type FieldChange = { field: string; from: string; to: string }
export type PriceChanges = {
  added: { code: string; task: string }[]
  removed: { code: string; task: string }[]
  changed: { code: string; task: string; fields: FieldChange[] }[]
}

const FIELDS: [keyof PriceBookRow, string][] = [
  ['standardPrice', 'Regular price'],
  ['memberPrice', 'Member price'],
  ['task', 'Task'],
  ['trade', 'Trade'],
  ['category', 'Category'],
  ['rateType', 'Rate type'],
  ['creditTier', 'Credit tier'],
  ['estHours', 'Hours'],
  ['notes', 'Notes'],
]
const show = (k: keyof PriceBookRow, v: unknown) => (k === 'standardPrice' || k === 'memberPrice' ? `$${Number(v).toLocaleString('en-US')}` : String(v ?? ''))

export function diffPriceBooks(current: Map<string, PriceBookRow>, next: PriceBookRow[]): PriceChanges {
  const nextMap = new Map(next.map((r) => [r.code, r]))
  const out: PriceChanges = { added: [], removed: [], changed: [] }
  for (const r of next) {
    const old = current.get(r.code)
    if (!old) {
      out.added.push({ code: r.code, task: r.task })
      continue
    }
    const fields = FIELDS.filter(([k]) => String(old[k] ?? '') !== String(r[k] ?? '')).map(([k, label]) => ({ field: label, from: show(k, old[k]), to: show(k, r[k]) }))
    if (fields.length) out.changed.push({ code: r.code, task: r.task, fields })
  }
  for (const [code, r] of current) if (!nextMap.has(code)) out.removed.push({ code, task: r.task })
  return out
}

// ---------- Publishing ----------

export async function publishPriceBook(rows: PriceBookRow[], changes: PriceChanges, by: { id: string; name: string }, fileName: string) {
  const db = adminClient()
  const { error } = await db.from('price_book').upsert(rows.map((r) => ({ ...toDb(r), updated_at: new Date().toISOString() })))
  if (error) throw new Error(error.message)
  const keep = rows.map((r) => r.code)
  const { data: existing } = await db.from('price_book').select('code')
  const gone = (existing ?? []).map((r) => r.code as string).filter((c) => !keep.includes(c))
  if (gone.length) await db.from('price_book').delete().in('code', gone)
  await db.from('price_book_versions').insert({ published_by: by.id || null, published_by_name: by.name, file_name: fileName, row_count: rows.length, changes })
}

// ---------- Download ----------

export function toCsv(rows: PriceBookRow[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [PRICE_COLUMNS.join(',')]
  for (const r of [...rows].sort((a, b) => a.code.localeCompare(b.code)))
    lines.push([r.code, r.trade, r.category, r.task, r.estHours ?? '', r.standardPrice, r.memberPrice, r.rateType, r.creditTier, r.notes].map(esc).join(','))
  return lines.join('\r\n') + '\r\n'
}

// ---------- Google Sheet sync ----------
// The office keeps the master price list in a Google Sheet. The app reads it about every
// 10 minutes (and on "Sync now"), checks it, and publishes it if it changed. A broken sheet
// never replaces good prices: the last good list stays and the office sees what's wrong.

export type SyncStatus = { at: string; ok: boolean; message: string; errors?: string[] }
// One link per trade tab (Electrical / HVAC / Plumbing), or a single link for a one-tab sheet.
export const TRADE_TABS = ['Electrical', 'HVAC', 'Plumbing'] as const
// Keys: the price tabs (Electrical / HVAC / Plumbing) and the check-up tabs (Check-up Electrical …).
export type SheetTabs = Partial<Record<string, string>>
export type PriceSettings = { sheetUrl: string | null; tabs: SheetTabs | null; lastCheckedAt: string | null; lastSync: SyncStatus | null }

const SYNC_EVERY_MS = 10 * 60 * 1000

export async function getPriceSettings(): Promise<PriceSettings> {
  const { data, error } = await adminClient()
    .from('app_settings')
    .select('key, value')
    .in('key', ['price_sheet_url', 'price_sheet_tabs', 'price_sheet_checked_at', 'price_sheet_last_sync'])
  if (error) throw new Error(error.message) // e.g. the price list setup file hasn't been run yet
  const get = (k: string) => data?.find((r) => r.key === k)?.value ?? null
  return { sheetUrl: get('price_sheet_url'), tabs: get('price_sheet_tabs'), lastCheckedAt: get('price_sheet_checked_at'), lastSync: get('price_sheet_last_sync') }
}

async function setSetting(key: string, value: unknown) {
  await adminClient().from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() })
}

export const savePriceSheetUrl = (url: string | null) => setSetting('price_sheet_url', url)
export const savePriceSheetTabs = (tabs: SheetTabs | null) => setSetting('price_sheet_tabs', tabs)
const hasTabs = (s: PriceSettings) => !!s.tabs && TRADE_TABS.some((t) => s.tabs?.[t])
export const sheetLinked = (s: PriceSettings) => hasTabs(s) || !!s.sheetUrl

// Accepts the sheet's normal link or its "Publish to web" link; returns the CSV download address.
export function sheetCsvUrl(link: string): string | null {
  let u: URL
  try {
    u = new URL(link.trim())
  } catch {
    return null
  }
  if (u.hostname !== 'docs.google.com' || !u.pathname.startsWith('/spreadsheets/')) return null
  if (u.pathname.includes('/d/e/')) {
    // "Publish to web" link
    u.pathname = u.pathname.replace(/\/pub(html)?$/, '/pub')
    u.searchParams.set('output', 'csv')
    return u.toString()
  }
  const id = /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/.exec(u.pathname)?.[1]
  if (!id) return null
  const gid = /gid=(\d+)/.exec(u.hash + u.search)?.[1] ?? '0'
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

type TabRead = { rows: Record<string, string>[] } | { error: string }

// Reads one tab of the Google Sheet as rows (column names normalised).
async function readTab(link: string, name: string, columns: readonly string[]): Promise<TabRead> {
  const csvUrl = sheetCsvUrl(link)
  if (!csvUrl) return { error: `${name}: that isn't a Google Sheets link.` }
  let text: string
  try {
    const res = await fetch(csvUrl, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(10_000) })
    text = await res.text()
    if (!res.ok || /^\s*<!DOCTYPE html|<html/i.test(text)) return { error: `${name}: could not read it. In the sheet, set Share → "Anyone with the link" → Viewer.` }
  } catch {
    return { error: 'Google Sheets did not answer. The app will try again shortly.' }
  }
  const rows = parseCsv(text.replace(/^\uFEFF/, '')).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [norm(k), v])))
  if (!rows.length) return { error: `${name} is empty — or the link points to the wrong tab.` }
  const missing = columns.filter((c) => !(c in rows[0]))
  if (missing.length) return { error: `${name}: missing columns ${missing.join(', ')}. Is the link pointing to the right tab?` }
  return { rows }
}

export async function syncFromSheet(by: { id: string | null; name: string }): Promise<SyncStatus> {
  const settings = await getPriceSettings()
  const now = new Date().toISOString()
  await setSetting('price_sheet_checked_at', now)
  const done = async (s: Omit<SyncStatus, 'at'>) => {
    const status = { at: now, ...s }
    await setSetting('price_sheet_last_sync', status)
    return status
  }
  // Price tabs: one per trade, or the single linked sheet.
  const priceSources: { tab: string | null; link: string }[] = hasTabs(settings)
    ? TRADE_TABS.map((t) => ({ tab: t, link: settings.tabs?.[t] ?? '' }))
    : settings.sheetUrl
      ? [{ tab: null, link: settings.sheetUrl }]
      : []
  if (!priceSources.length) return done({ ok: false, message: 'No Google Sheet linked yet.' })
  // Check-up tabs (optional): all three or none.
  const checkSources = (Object.entries(CHECKLIST_TABS) as [string, string][]).map(([trade, tab]) => ({ trade, tab, link: settings.tabs?.[tab] ?? '' }))
  const checklistLinked = checkSources.some((x) => x.link)
  const missingTabs = [...priceSources.filter((x) => !x.link).map((x) => x.tab), ...(checklistLinked ? checkSources.filter((x) => !x.link).map((x) => x.tab) : [])]
  if (missingTabs.length) return done({ ok: false, message: `Missing the link for the ${missingTabs.join(' and ')} tab.` })

  const priceRaw: Record<string, string>[] = []
  for (const src of priceSources) {
    const r = await readTab(src.link, src.tab ? `${src.tab} tab` : 'The sheet', PRICE_COLUMNS)
    if ('error' in r) return done({ ok: false, message: r.error })
    r.rows.forEach((row, i) => {
      row._where = src.tab ? `${src.tab} tab, row ${i + 2}` : `Row ${i + 2}`
      if (src.tab) row._tab = src.tab
    })
    priceRaw.push(...r.rows)
  }
  const guideRaw: Record<string, string>[] = []
  for (const src of checklistLinked ? checkSources : []) {
    const r = await readTab(src.link, `${src.tab} tab`, GUIDE_COLUMNS)
    if ('error' in r) return done({ ok: false, message: r.error })
    r.rows.forEach((row, i) => {
      row._where = `${src.tab} tab, row ${i + 2}`
      row._tab = src.trade
    })
    guideRaw.push(...r.rows)
  }

  // Check both together: findings must point to codes in the new price list, and the
  // price list must keep every code the (new) checklist uses.
  const priceCodes = new Set(priceRaw.map((r) => (r.code ?? '').trim().toUpperCase()).filter(Boolean))
  const guideCheck = checklistLinked ? checkGuideRows(guideRaw, priceCodes) : { rows: [...(await liveGuide()).values()], errors: [] }
  const priceCheck = checkPriceRows(priceRaw, guideCheck.rows)
  const errors = [...priceCheck.errors, ...guideCheck.errors]
  if (errors.length) return done({ ok: false, message: 'The sheet has problems, so the app is still using the last good version.', errors })

  const byWho = { id: by.id ?? '', name: by.name }
  const parts: string[] = []
  const priceChanges = diffPriceBooks(await livePriceBook(), priceCheck.rows)
  const nPrice = priceChanges.added.length + priceChanges.removed.length + priceChanges.changed.length
  if (nPrice || (await priceBookSource()) === 'file') {
    await publishPriceBook(priceCheck.rows, priceChanges, byWho, 'Google Sheet')
    parts.push(nPrice ? `${nPrice} price ${nPrice === 1 ? 'change' : 'changes'}` : 'the price list')
  }
  if (checklistLinked) {
    const { reordered, ...guideChanges } = diffGuides(await liveGuide(), guideCheck.rows)
    const nGuide = guideChanges.added.length + guideChanges.removed.length + guideChanges.changed.length
    if (nGuide || reordered || (await guideSource()) === 'file') {
      await publishGuide(guideCheck.rows, guideChanges, byWho, 'Google Sheet')
      parts.push(nGuide ? `${nGuide} check-up ${nGuide === 1 ? 'change' : 'changes'}` : reordered ? 'the new check-up order' : 'the check-up list')
    }
  }
  if (!parts.length) return done({ ok: true, message: 'Up to date — no changes in the sheet.' })
  return done({ ok: true, message: `Published ${parts.join(' and ')} from the sheet.` })
}

// Called when prices are used: if the last check is older than 10 minutes, sync in the background.
export async function syncIfDue() {
  if (!supabaseConfigured || !process.env.SUPABASE_SECRET_KEY) return
  try {
    const s = await getPriceSettings()
    if (!sheetLinked(s)) return
    if (s.lastCheckedAt && Date.now() - new Date(s.lastCheckedAt).getTime() < SYNC_EVERY_MS) return
    await syncFromSheet({ id: null, name: 'Automatic sync' })
  } catch {
    // Never let a sync problem break a page; the office sees the last status.
  }
}

// The price list as an Excel file: one tab per trade, plus the How to tab.
export async function toXlsx(rows: PriceBookRow[], guide: GuideRow[]): Promise<Buffer> {
  const header = PRICE_COLUMNS.map((c) => ({ value: c as string, fontWeight: 'bold' as const }))
  const tradeSheet = (trade: string) => ({
    sheet: trade,
    stickyRowsCount: 1,
    columns: [{ width: 10 }, { width: 11 }, { width: 14 }, { width: 46 }, { width: 9 }, { width: 14 }, { width: 14 }, { width: 10 }, { width: 11 }, { width: 50 }],
    data: [
      header,
      ...rows
        .filter((r) => r.trade === trade)
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((r) => [
          { value: r.code },
          { value: r.trade },
          { value: r.category },
          { value: r.task },
          { value: r.estHours ?? '' },
          { value: r.standardPrice, type: Number },
          { value: r.memberPrice, type: Number },
          { value: r.rateType },
          { value: r.creditTier },
          { value: r.notes },
        ]),
    ],
  })
  const howTo = {
    sheet: 'How to',
    columns: [{ width: 26 }, { width: 100 }, { width: 26 }],
    data: PRICE_SHEET_HOW_TO.map((row, i) =>
      row.map((v, j) => ({ value: v, fontWeight: (i === 0 || (j === 0 && v === v.toUpperCase() && v.length > 3) || i === 9 ? 'bold' : undefined) as 'bold' | undefined, wrap: j === 1 })),
    ),
  }
  // Same column order Google Sheets expects; cells without a value are fine.
  return writeXlsx([...TRADE_TABS.map(tradeSheet), ...guideSheets(guide), howTo] as Parameters<typeof writeXlsx>[0]).toBuffer()
}
