'use server'

import { revalidatePath } from 'next/cache'
import { loadInspectionGuide } from '@/lib/data'
import {
  checkPriceRows,
  diffPriceBooks,
  livePriceBook,
  publishPriceBook,
  readPriceFile,
  savePriceSheetUrl,
  sheetCsvUrl,
  syncFromSheet,
  type PriceChanges,
  type SyncStatus,
} from '@/lib/priceBook'
import { requireStaff } from '@/lib/staff'
import type { PriceBookRow } from '@/lib/types'

const guide = () => [...loadInspectionGuide().values()]

export async function linkSheet(form: FormData): Promise<SyncStatus | { error: string }> {
  const me = await requireStaff('admin')
  const link = String(form.get('url') ?? '').trim()
  if (!link) {
    await savePriceSheetUrl(null)
    revalidatePath('/office/prices')
    return { at: new Date().toISOString(), ok: true, message: 'Google Sheet unlinked. The current prices stay as they are.' }
  }
  if (!sheetCsvUrl(link)) return { error: 'That doesn’t look like a Google Sheets link. Copy it from the browser address bar while the sheet is open.' }
  await savePriceSheetUrl(link)
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
