'use server'

import { revalidatePath } from 'next/cache'
import { loadInspectionGuide } from '@/lib/data'
import {
  checkPriceRows,
  diffPriceBooks,
  livePriceBook,
  publishPriceBook,
  readPriceFile,
  savePriceSheetTabs,
  savePriceSheetUrl,
  sheetCsvUrl,
  TRADE_TABS,
  type SheetTabs,
  syncFromSheet,
  type PriceChanges,
  type SyncStatus,
} from '@/lib/priceBook'
import { requireStaff } from '@/lib/staff'
import type { PriceBookRow } from '@/lib/types'

const guide = () => [...loadInspectionGuide().values()]

// One link per trade tab. Copy each from the browser bar while that tab is open.
export async function linkSheet(form: FormData): Promise<SyncStatus | { error: string }> {
  const me = await requireStaff('admin')
  const tabs: SheetTabs = Object.fromEntries(TRADE_TABS.map((t) => [t, String(form.get(`tab_${t}`) ?? '').trim()]))
  if (TRADE_TABS.every((t) => !tabs[t])) {
    await savePriceSheetTabs(null)
    await savePriceSheetUrl(null)
    revalidatePath('/office/prices')
    return { at: new Date().toISOString(), ok: true, message: 'Google Sheet unlinked. The current prices stay as they are.' }
  }
  for (const t of TRADE_TABS) {
    if (!tabs[t]) return { error: `Please paste the link for the ${t} tab too.` }
    if (!sheetCsvUrl(tabs[t]!)) return { error: `The ${t} link doesn’t look like a Google Sheets link. Copy it from the browser bar while that tab is open.` }
  }
  const gids = TRADE_TABS.map((t) => /gid=(\d+)/.exec(tabs[t]!)?.[1] ?? '0')
  if (new Set(gids).size < gids.length) return { error: 'Two of the links point to the same tab. Open each tab, then copy its link from the browser bar.' }
  await savePriceSheetTabs(tabs)
  await savePriceSheetUrl(null)
  const status = await syncFromSheet({ id: me.id, name: me.name || me.email }, guide())
  revalidatePath('/office/prices')
  return status
}

export async function syncNow(): Promise<SyncStatus> {
  const me = await requireStaff('admin')
  const status = await syncFromSheet({ id: me.id, name: me.name || me.email }, guide())
  revalidatePath('/office/prices')
  return status
}

// Backup way: upload a file. Step 1 shows what would change; step 2 publishes.
export async function previewUpload(form: FormData): Promise<{ errors: string[]; changes?: PriceChanges; rows?: PriceBookRow[]; fileName: string }> {
  await requireStaff('admin')
  const file = form.get('file')
  if (!(file instanceof File) || !file.size) return { errors: ['Please choose a file.'], fileName: '' }
  if (file.size > 2_000_000) return { errors: ['That file is too big for a price list.'], fileName: file.name }
  let raw: Record<string, string>[]
  try {
    raw = await readPriceFile(file.name, Buffer.from(await file.arrayBuffer()))
  } catch (e) {
    return { errors: [(e as Error).message], fileName: file.name }
  }
  const { rows, errors } = checkPriceRows(raw, guide())
  if (errors.length) return { errors, fileName: file.name }
  return { errors: [], rows, changes: diffPriceBooks(await livePriceBook(), rows), fileName: file.name }
}

export async function publishUpload(rows: PriceBookRow[], fileName: string): Promise<{ ok: true } | { error: string }> {
  const me = await requireStaff('admin')
  // Check again on the server: never trust what comes back from the browser.
  const raw = rows.map((r) => ({
    code: r.code,
    trade: r.trade,
    category: r.category,
    task: r.task,
    est_hours: r.estHours ?? '',
    standard_price: String(r.standardPrice),
    member_price: String(r.memberPrice),
    rate_type: r.rateType,
    credit_tier: r.creditTier,
    notes: r.notes,
  }))
  const checked = checkPriceRows(raw, guide())
  if (checked.errors.length) return { error: checked.errors.join(' ') }
  await publishPriceBook(checked.rows, diffPriceBooks(await livePriceBook(), checked.rows), { id: me.id, name: me.name || me.email }, fileName)
  revalidatePath('/office/prices')
  return { ok: true }
}
