'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui'
import type { PriceChanges, SheetTabs, SyncStatus } from '@/lib/priceBook'
import type { PriceBookRow } from '@/lib/types'
import { linkSheet, previewUpload, publishUpload, syncNow } from './actions'

const field = 'h-11 rounded-[10px] border border-edge bg-white px-3 text-[15px] text-navy'
const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function Status({ s }: { s: SyncStatus | null }) {
  if (!s) return null
  return (
    <div className={`flex flex-col gap-1 rounded-[10px] px-3 py-2 text-sm ${s.ok ? 'bg-success-bg text-success' : 'bg-[#FDE7E4] text-alert'}`}>
      <b>
        {s.ok ? '✓' : '⚠'} {s.message} <span className="font-normal opacity-80">({fmt(s.at)})</span>
      </b>
      {s.errors?.slice(0, 12).map((e) => (
        <span key={e} className="text-body">
          • {e}
        </span>
      ))}
      {(s.errors?.length ?? 0) > 12 && <span className="text-body">…and {s.errors!.length - 12} more</span>}
    </div>
  )
}

function Changes({ c }: { c: PriceChanges }) {
  const n = c.added.length + c.removed.length + c.changed.length
  if (!n) return <div className="text-[15px] text-body">No changes compared with the current prices.</div>
  return (
    <div className="flex flex-col gap-1 text-[15px]">
      {c.changed.map((x) => (
        <div key={x.code}>
          <b>{x.code}</b> {x.task}: {x.fields.map((f) => `${f.field} ${f.from} → ${f.to}`).join(' · ')}
        </div>
      ))}
      {c.added.map((x) => (
        <div key={x.code} className="text-success">
          + New: <b>{x.code}</b> {x.task}
        </div>
      ))}
      {c.removed.map((x) => (
        <div key={x.code} className="text-alert">
          − Removed: <b>{x.code}</b> {x.task}
        </div>
      ))}
    </div>
  )
}

export default function PricesClient({
  sheetUrl,
  tabs,
  lastSync,
  source,
  count,
  guideSource,
  guideCount,
}: {
  sheetUrl: string | null
  tabs: SheetTabs | null
  lastSync: SyncStatus | null
  source: 'database' | 'file'
  count: number
  guideSource: 'database' | 'file'
  guideCount: number
}) {
  const [status, setStatus] = useState<SyncStatus | null>(lastSync)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ changes: PriceChanges; rows: PriceBookRow[]; fileName: string } | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [pending, start] = useTransition()
  const linked = !!sheetUrl || (!!tabs && Object.values(tabs).some(Boolean))

  return (
    <>
      <Card className="flex flex-col gap-3">
        <div className="text-base font-bold">Google Sheet (the master price list and check-up list)</div>
        <div className="text-sm text-body">
          {linked
            ? 'The app reads the sheet about every 10 minutes and publishes changes after checking them. Trades can be given view access to the same sheet.'
            : 'Link your Google Sheet and the app keeps itself up to date from it. Steps below.'}{' '}
          In use now: <b>{count} price items</b> and <b>{guideCount} check-up findings</b>, from{' '}
          {source === 'database' ? 'the published list' : 'the starter file'} / {guideSource === 'database' ? 'the published checklist' : 'the starter file'}.
        </div>
        {sheetUrl && !tabs && (
          <div className="rounded-[10px] bg-[#FFF1CC] px-3 py-2 text-sm text-[#6B4700]">
            Linked now as a single tab. To split it into Electrical / HVAC / Plumbing tabs, follow the steps below and paste the three tab links.
          </div>
        )}
        <form
          action={(form) =>
            start(async () => {
              setError(null)
              const r = await linkSheet(form)
              if ('error' in r) setError(r.error)
              else setStatus(r)
            })
          }
          className="flex flex-col gap-2"
        >
          <div className="text-sm font-bold">Price list tabs</div>
          {(['Electrical', 'HVAC', 'Plumbing'] as const).map((t) => (
            <label key={t} className="flex flex-col gap-1 text-xs font-semibold text-muted sm:flex-row sm:items-center sm:gap-3">
              <span className="w-44 shrink-0 text-sm text-navy">{t} tab</span>
              <input
                name={`tab_${t}`}
                defaultValue={tabs?.[t] ?? ''}
                placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=…"
                className={`${field} min-w-0 grow`}
              />
            </label>
          ))}
          <div className="mt-1 text-sm font-bold">
            Check-up tabs <span className="font-normal text-muted">(the Inspection Guide — optional until you add these tabs)</span>
          </div>
          {(['Check-up Electrical', 'Check-up HVAC', 'Check-up Plumbing'] as const).map((t) => (
            <label key={t} className="flex flex-col gap-1 text-xs font-semibold text-muted sm:flex-row sm:items-center sm:gap-3">
              <span className="w-44 shrink-0 text-sm text-navy">{t} tab</span>
              <input
                name={`tab_${t}`}
                defaultValue={tabs?.[t] ?? ''}
                placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=…"
                className={`${field} min-w-0 grow`}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white">
              {pending ? 'Checking…' : 'Save tab links'}
            </button>
            {linked && (
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => setStatus(await syncNow()))}
                className="h-11 rounded-[10px] border border-navy px-4 text-[15px] font-bold text-navy"
              >
                Sync now
              </button>
            )}
          </div>
        </form>
        {error && <div className="text-sm font-semibold text-alert">{error}</div>}
        <Status s={status} />
        <details open={!tabs} className="text-sm text-body">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-navy">How to set up the sheet (price and check-up tabs)</summary>
          <ol className="list-decimal pl-5 leading-relaxed">
            <li>
              <a href="/office/prices/download" className="font-semibold text-link underline">
                Download the current price list
              </a>{' '}
              — an Excel file with the tabs Electrical, HVAC, Plumbing, Check-up Electrical, Check-up HVAC, Check-up Plumbing and How to.
            </li>
            <li>
              Open your Google Sheet → <b>File → Import → Upload</b> that file → <b>Replace spreadsheet</b> → Import data. (It keeps the same sheet and who
              it’s shared with.)
            </li>
            <li>
              If it isn’t shared yet: <b>Share → General access → Anyone with the link → Viewer</b>. Editors: you and the office. Trades: Viewer or
              Commenter.
            </li>
            <li>
              Click the <b>Electrical</b> tab, copy the address from the browser bar, paste it in the Electrical box above. Do the same for every tab —
              each has its own address (it ends in a different gid number). The How to tab isn’t linked.
            </li>
            <li>
              Press <b>Save tab links</b>. You should see ✓.
            </li>
          </ol>
        </details>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="text-base font-bold">Or upload a file</div>
        <div className="text-sm text-body">
          Excel (.xlsx, one tab per trade) or CSV, same columns as the{' '}
          <a href="/office/prices/download" className="font-semibold text-link underline">
            downloaded list
          </a>
          .{linked && ' Note: a linked Google Sheet will replace uploaded prices at its next sync — change the sheet instead.'}
        </div>
        <form
          action={(form) =>
            start(async () => {
              setPreview(null)
              const r = await previewUpload(form)
              setUploadErrors(r.errors)
              if (r.changes && r.rows) setPreview({ changes: r.changes, rows: r.rows, fileName: r.fileName })
            })
          }
          className="flex flex-wrap items-center gap-2"
        >
          <input name="file" type="file" accept=".xlsx,.csv" required className="text-sm" />
          <button type="submit" disabled={pending} className="h-11 rounded-[10px] border border-navy px-4 text-[15px] font-bold text-navy">
            Check file
          </button>
        </form>
        {uploadErrors.length > 0 && (
          <div className="flex flex-col gap-1 rounded-[10px] bg-[#FDE7E4] px-3 py-2 text-sm text-alert">
            <b>Not published — please fix:</b>
            {uploadErrors.map((e) => (
              <span key={e}>• {e}</span>
            ))}
          </div>
        )}
        {preview && (
          <div className="flex flex-col gap-2 rounded-[10px] border-2 border-navy p-3">
            <b>What would change ({preview.fileName}):</b>
            <Changes c={preview.changes} />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await publishUpload(preview.rows, preview.fileName)
                    if ('error' in r) setUploadErrors([r.error])
                    else {
                      setPreview(null)
                      setStatus({ at: new Date().toISOString(), ok: true, message: `Published from ${preview.fileName}.` })
                    }
                  })
                }
                className="h-11 rounded-[10px] bg-approve px-4 text-[15px] font-bold text-white"
              >
                Publish these prices
              </button>
              <button type="button" onClick={() => setPreview(null)} className="h-11 px-3 text-[15px] font-semibold text-link">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
