// Server-only: reads the price book and inspection guide CSVs from /data.
import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { parseCsv } from './csv'
import type { GuideRow, PriceBookRow } from './types'
import type { Rating } from '@/config/business'

const dataDir = path.join(process.cwd(), 'data')

function readCsv(name: string) {
  return parseCsv(fs.readFileSync(path.join(dataDir, name), 'utf8'))
}

export function loadPriceBook(): Map<string, PriceBookRow> {
  const rows = readCsv('pricebook.csv').map<PriceBookRow>((r) => ({
    code: r.code,
    trade: r.trade,
    category: r.category,
    task: r.task,
    estHours: r.est_hours,
    standardPrice: Number(r.standard_price),
    memberPrice: Number(r.member_price),
    rateType: r.rate_type === 'Install' ? 'Install' : 'Service',
    creditTier: r.credit_tier,
    notes: r.notes,
  }))
  return new Map(rows.map((r) => [r.code, r]))
}

export function loadInspectionGuide(): Map<string, GuideRow> {
  const lastHow = new Map<string, string>()
  const rows = readCsv('inspection_guide.csv').map<GuideRow>((r) => ({
    id: r.id,
    trade: r.trade,
    area: r.area,
    howToCheck: (() => {
      const key = r.trade + '|' + r.area
      const how = r.how_to_check.startsWith('Same')
        ? (lastHow.get(key) ?? '') + r.how_to_check.slice(4)
        : r.how_to_check
      lastHow.set(key, how)
      return how
    })(),
    whoCanCheck: r.who_can_check,
    finding: r.finding,
    rating: r.rating as Rating,
    recommend: r.recommend,
    pricebookCode: r.pricebook_code,
    customerTitle: r.customer_title,
    customerMessage: r.customer_message,
  }))
  return new Map(rows.map((r) => [r.id, r]))
}

export function readSample<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, 'samples', name), 'utf8')) as T
}

export function loadCatalog() {
  return { guide: loadInspectionGuide(), book: loadPriceBook() }
}

// Like loadCatalog, but prices come from the office price list (database) once it
// has been published; until then from data/pricebook.csv.
export async function loadCatalogLive() {
  const { livePriceBook, syncIfDue } = await import('./priceBook')
  const { after } = await import('next/server')
  const guide = loadInspectionGuide()
  // Check the Google Sheet after the page is sent, so pages stay fast.
  after(() => syncIfDue([...guide.values()]))
  return { guide, book: await livePriceBook() }
}
