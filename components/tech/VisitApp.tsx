'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ratings, tradeInfo } from '@/config/business'
import { money, priceLine } from '@/lib/pricing'
import {
  areaDone,
  areaTarget,
  checklistAreas,
  defaultTitle,
  findingTarget,
  selectedFindings,
  sendBlockers,
  toCheckupInput,
  tradeOrder,
  tradeProgress,
  type Area,
  type Visit,
  type VisitWork,
} from '@/lib/tech'
import type { GuideRow, PriceBookRow } from '@/lib/types'
import { useVisitWork } from '@/lib/useVisitWork'
import { buildReport } from '@/lib/views'
import CheckupReport from '../CheckupReport'
import { Card, Logo } from '../ui'
import PhotoButton from './PhotoButton'

type Section = 'home' | 'send' | string // trade key for checklist sections

const tradeLabel = (t: string) => tradeInfo[t]?.label ?? t

export default function VisitApp({
  visit,
  techName,
  guide,
  book,
}: {
  visit: Visit
  techName: string
  guide: GuideRow[]
  book: PriceBookRow[]
}) {
  const catalog = useMemo(
    () => ({ guide: new Map(guide.map((g) => [g.id, g])), book: new Map(book.map((b) => [b.code, b])) }),
    [guide, book],
  )
  const areas = useMemo(() => checklistAreas(guide), [guide])
  const { work, update, reset, saveError } = useVisitWork(visit)
  const [section, setSection] = useState<Section>('home')
  const [preview, setPreview] = useState(false)
  const checkup = visit.kind === 'checkup'

  // Where to scroll after switching section (a "Take me there" from Review & send).
  const [target, setTarget] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)

  const go = (s: Section, to?: string) => {
    setSection(s)
    setTarget(to ?? null)
    if (!to) window.scrollTo(0, 0)
  }

  useEffect(() => {
    if (!target) return
    const el = document.getElementById(target)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlight(target)
    setTarget(null)
    const t = setTimeout(() => setHighlight(null), 2500)
    return () => clearTimeout(t)
  }, [target, section])

  if (preview) {
    const today = new Date().toISOString().slice(0, 10)
    const report = buildReport(toCheckupInput(visit, work, areas, catalog.guide, techName, today), catalog)
    return (
      <>
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[#0B1528] px-4 py-2 text-sm text-white">
          <span className="font-semibold">Customer preview — this is what the customer will see</span>
          <button type="button" onClick={() => setPreview(false)} className="h-11 rounded-[10px] bg-white px-4 font-bold text-navy">
            Back to visit
          </button>
        </div>
        <CheckupReport report={report} />
      </>
    )
  }

  const sections: { id: Section; label: string; badge?: string; done?: boolean }[] = [
    { id: 'home', label: 'Home profile', badge: `${work.equipment.length} items` },
    ...(checkup
      ? [
          ...tradeOrder.map((t) => {
            const p = tradeProgress(work, areas, t)
            return { id: t, label: tradeLabel(t), badge: `${p.done}/${p.total}`, done: p.complete }
          }),
          { id: 'send', label: 'Review & send' },
        ]
      : [{ id: 'send', label: 'Estimate' }]),
  ]

  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 pt-[18px] pb-4">
          <div className="flex items-center justify-between gap-3">
            <Logo tagline="TECH" />
            <Link href="/tech" className="flex h-11 items-center text-sm font-semibold text-sub">
              ← Today&apos;s visits
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] leading-[1.05] font-bold">{visit.customer.name}</h1>
            <div className="text-sm text-sub">
              {visit.window} · {visit.address} ·{' '}
              {checkup ? `${visit.season === 'spring' ? 'Spring (AC focus)' : 'Fall (furnace focus)'} check-up` : `Service call: ${visit.complaint}`}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-start">
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 md:sticky md:top-4 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:px-0">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={section === s.id}
              className={`flex h-12 shrink-0 items-center justify-between gap-3 rounded-[10px] border px-3 text-left text-[15px] font-semibold ${
                section === s.id ? 'border-navy bg-navy text-white' : 'border-edge bg-white text-navy'
              }`}
            >
              <span className="flex items-center gap-2">
                {tradeInfo[s.id] && <span className="h-5 w-1.5 rounded-sm" style={{ background: tradeInfo[s.id].color }} />}
                {s.label}
              </span>
              {s.badge && (
                <span className={`text-xs font-bold ${s.done ? (section === s.id ? 'text-[#9FE0B8]' : 'text-success') : 'opacity-70'}`}>
                  {s.done ? '✓ ' : ''}
                  {s.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <main className="flex min-w-0 grow flex-col gap-3.5">
          {saveError && (
            <Card className="border border-alert text-sm text-alert">
              This device is out of room to keep photos. Remove a photo or two; saving to the office comes with the database step.
            </Card>
          )}
          {section === 'home' && <HomeProfile visit={visit} work={work} update={update} />}
          {tradeInfo[section] && checkup && (
            <TradeChecklist
              trade={section}
              areas={areas.filter((a) => a.trade === section)}
              work={work}
              update={update}
              visit={visit}
              book={catalog.book}
              highlight={highlight}
            />
          )}
          {section === 'send' &&
            (checkup ? (
              <SendPanel
                visit={visit}
                work={work}
                update={update}
                reset={reset}
                areas={areas}
                guide={catalog.guide}
                book={catalog.book}
                onPreview={() => {
                  setPreview(true)
                  window.scrollTo(0, 0)
                }}
                onGoTo={go}
              />
            ) : (
              <Card className="flex flex-col gap-2">
                <div className="text-lg font-bold">Service-call estimate</div>
                <div className="text-[15px] text-body">
                  Building the options (Repair / Repair + tune-up / Replace) from the price book comes in a next step. For now, the customer
                  estimate page is at{' '}
                  <Link href="/estimate/demo" className="font-semibold text-link underline">
                    /estimate/demo
                  </Link>
                  .
                </div>
              </Card>
            ))}
        </main>
      </div>
    </>
  )
}

type Update = (fn: (w: VisitWork) => VisitWork) => void

// ---------------- Home profile ----------------

const equipmentTypes = ['Furnace', 'AC condenser', 'Heat pump', 'Water heater', 'Electrical panel', 'Sump pump', 'Thermostat', 'Other']

function HomeProfile({ visit, work, update }: { visit: Visit; work: VisitWork; update: Update }) {
  const thisYear = new Date().getFullYear()
  const [newType, setNewType] = useState(equipmentTypes[0])
  const setEq = (id: string, patch: Partial<VisitWork['equipment'][number]>) =>
    update((w) => ({ ...w, equipment: w.equipment.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))

  return (
    <>
      <Card className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Fact label="Home built" value={String(visit.homeYear)} />
        <Fact
          label="Membership"
          value={visit.customer.isMember ? `Member since ${fmtMonth(visit.customer.memberSince)}` : 'Not a member'}
        />
        <Fact label="Equipment on file" value={String(work.equipment.length)} />
      </Card>
      <h2 className="mt-1 font-display text-lg font-bold tracking-[0.06em] text-muted">EQUIPMENT</h2>
      <div className="grid gap-3.5 lg:grid-cols-2">
        {work.equipment.map((e) => {
          const age = e.year ? thisYear - e.year : null
          return (
            <Card key={e.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-bold">{e.type}</div>
                <div className="text-sm font-semibold text-muted">{age !== null ? `${age} years old` : 'Age unknown'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Brand" value={e.brand} onChange={(v) => setEq(e.id, { brand: v })} />
                <Field label="Model" value={e.model} onChange={(v) => setEq(e.id, { model: v })} />
                <Field
                  label="Year installed"
                  value={e.year ? String(e.year) : ''}
                  inputMode="numeric"
                  onChange={(v) => {
                    const n = parseInt(v.replace(/\D/g, '').slice(0, 4), 10)
                    setEq(e.id, { year: Number.isNaN(n) ? null : n })
                  }}
                />
              </div>
              <PhotoButton label="Label photo" photo={e.labelPhoto} onPhoto={(p) => setEq(e.id, { labelPhoto: p })} />
            </Card>
          )
        })}
      </div>
      <Card className="flex flex-wrap items-center gap-2">
        <span className="text-[15px] font-semibold">Add equipment</span>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="h-11 rounded-[10px] border border-edge bg-white px-3 text-[15px]"
        >
          {equipmentTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            update((w) => ({
              ...w,
              equipment: [...w.equipment, { id: `e${Date.now()}`, type: newType, brand: '', model: '', year: null }],
            }))
          }
          className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white"
        >
          Add
        </button>
      </Card>
    </>
  )
}

const fmtMonth = (iso?: string) =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-[15px] font-bold">{value}</span>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  inputMode?: 'numeric'
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-[10px] border border-edge bg-white px-3 text-[15px] text-navy"
      />
    </label>
  )
}

// ---------------- Checklist for one trade ----------------

function TradeChecklist({
  trade,
  areas,
  work,
  update,
  visit,
  book,
  highlight,
}: {
  trade: string
  areas: Area[]
  work: VisitWork
  update: Update
  visit: Visit
  book: Map<string, PriceBookRow>
  highlight: string | null
}) {
  const p = tradeProgress(work, areas, trade)
  const setArea = (key: string, next: { ok: boolean; findings: string[] }) =>
    update((w) => ({ ...w, areas: { ...w.areas, [key]: next } }))

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{tradeLabel(trade)}</h2>
        <span className={`text-sm font-semibold ${p.complete ? 'text-success' : 'text-muted'}`}>
          {p.complete ? '✓ All areas checked' : `${p.done} of ${p.total} areas checked`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full" style={{ width: `${(100 * p.done) / p.total}%`, background: tradeInfo[trade].color }} />
      </div>

      {areas.map((a) => {
        const state = work.areas[a.key] ?? { ok: false, findings: [] }
        const done = areaDone(work, a.key)
        const lit = highlight === areaTarget(a.key)
        return (
          <div
            key={a.key}
            id={areaTarget(a.key)}
            className={`flex scroll-mt-4 flex-col overflow-hidden rounded-xl bg-white transition-shadow ${lit ? 'ring-4 ring-approve' : ''}`}
          >
            <div className="h-1" style={{ background: tradeInfo[trade].color }} />
            <div className="flex flex-col gap-2.5 px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-base font-bold">
                    {done && <span className="text-success">✓</span>}
                    {a.area}
                    {!done && <span className="rounded-full bg-[#FFF1CC] px-2 py-0.5 text-xs font-bold text-[#6B4700]">Not checked</span>}
                    {a.rows.some((r) => r.whoCanCheck === 'Trade tech') && (
                      <span className="rounded-full bg-page px-2 py-0.5 text-xs font-bold text-muted">Trade tech</span>
                    )}
                  </div>
                  <div className="text-sm text-body">{a.howToCheck}</div>
                </div>
                <button
                  type="button"
                  aria-pressed={state.ok}
                  onClick={() => setArea(a.key, { ok: !state.ok, findings: [] })}
                  className={`h-11 min-w-[88px] shrink-0 rounded-[10px] border-2 text-base font-bold ${
                    state.ok ? 'border-success bg-success text-white' : 'border-success bg-white text-success'
                  }`}
                >
                  {state.ok ? '✓ OK' : 'OK'}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {a.rows.map((g) => {
                  const on = state.findings.includes(g.id)
                  const r = ratings[g.rating]
                  const litF = highlight === findingTarget(g.id)
                  return (
                    <div
                      key={g.id}
                      id={findingTarget(g.id)}
                      className={`flex flex-col rounded-[10px] border ${on ? 'border-navy' : 'border-line'} ${litF ? 'ring-4 ring-approve' : ''}`}
                    >
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setArea(a.key, {
                            ok: false,
                            findings: on ? state.findings.filter((f) => f !== g.id) : [...state.findings, g.id],
                          })
                        }
                        className="flex min-h-11 items-center gap-3 px-3 py-2 text-left"
                      >
                        <span className={`flex size-5 shrink-0 items-center justify-center rounded border-2 border-navy ${on ? 'bg-navy text-white' : ''}`}>
                          {on && <span className="text-xs leading-none">✓</span>}
                        </span>
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap" style={{ background: r.bg, color: r.fg }}>
                          {g.rating}
                        </span>
                        <span className="grow text-sm text-navy">{g.finding}</span>
                        <span className="shrink-0 text-sm font-semibold text-muted">{priceHint(g, book, visit)}</span>
                      </button>
                      {on && <FindingEditor g={g} work={work} update={update} book={book} visit={visit} />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      <QuoteRequests trade={trade} work={work} update={update} />
    </>
  )
}

function priceHint(g: GuideRow, book: Map<string, PriceBookRow>, visit: Visit) {
  if (!g.pricebookCode) return g.rating === 'GREEN' ? 'Monitor' : ''
  if (g.pricebookCode === 'Quote') return 'Office quote'
  const row = book.get(g.pricebookCode)
  if (!row) return ''
  const p = priceLine(row, visit.customer)
  const price = p.price === 0 ? 'Included' : money(p.price)
  return row.category === 'Diagnostic' ? `${price} diagnostic` : price
}

function FindingEditor({
  g,
  work,
  update,
  book,
  visit,
}: {
  g: GuideRow
  work: VisitWork
  update: Update
  book: Map<string, PriceBookRow>
  visit: Visit
}) {
  const n = work.notes[g.id] ?? { title: defaultTitle(g), note: '' }
  const set = (patch: Partial<typeof n>) => update((w) => ({ ...w, notes: { ...w.notes, [g.id]: { ...n, ...patch } } }))
  const row = g.pricebookCode && g.pricebookCode !== 'Quote' ? book.get(g.pricebookCode) : undefined
  const price = row ? priceLine(row, visit.customer) : null

  return (
    <div className="flex flex-col gap-2.5 border-t border-line bg-[#FAFBFC] px-3 py-3">
      <label className="flex flex-col gap-1 text-xs text-muted">
        Title the customer sees
        <input
          value={n.title}
          onChange={(e) => set({ title: e.target.value })}
          className="h-11 rounded-[10px] border border-edge bg-white px-3 text-[15px] text-navy"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        What you saw (optional, in plain words — shown before: “{g.customerMessage}”)
        <textarea
          value={n.note}
          rows={2}
          onChange={(e) => set({ note: e.target.value })}
          className="rounded-[10px] border border-edge bg-white px-3 py-2 text-[15px] text-navy"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PhotoButton photo={n.photo} onPhoto={(p) => set({ photo: p })} required={g.rating === 'RED'} />
        <div className="text-right text-sm">
          <div className="font-semibold text-navy">
            🔒 {g.recommend}
            {row ? ` · ${row.code}` : ''}
          </div>
          <div className="text-muted">
            {price
              ? `${price.price === 0 ? 'Included' : money(price.price)} · ${price.note} · from the price book`
              : g.pricebookCode === 'Quote'
                ? 'The office will send a quote'
                : 'No charge — re-check next visit'}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuoteRequests({ trade, work, update }: { trade: string; work: VisitWork; update: Update }) {
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const mine = work.quoteRequests.filter((q) => q.trade === trade)
  return (
    <Card className="flex flex-col gap-2.5">
      <div className="text-base font-bold">Something not on this list?</div>
      <div className="text-sm text-body">
        Describe it and take a photo. It goes to the office for a quote — it is not added to the customer&apos;s report.
      </div>
      {mine.map((q) => (
        <div key={q.id} className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2">
          {q.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.photo} alt="" className="size-12 rounded-lg object-cover" />
          )}
          <span className="grow text-sm">{q.description}</span>
          <button
            type="button"
            onClick={() => update((w) => ({ ...w, quoteRequests: w.quoteRequests.filter((x) => x.id !== q.id) }))}
            className="h-11 px-2 text-sm font-semibold text-link"
          >
            Remove
          </button>
        </div>
      ))}
      <textarea
        value={text}
        rows={2}
        placeholder="What did you find?"
        onChange={(e) => setText(e.target.value)}
        className="rounded-[10px] border border-edge bg-white px-3 py-2 text-[15px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PhotoButton photo={photo} onPhoto={setPhoto} />
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            update((w) => ({
              ...w,
              quoteRequests: [...w.quoteRequests, { id: `q${Date.now()}`, trade, description: text.trim(), photo }],
            }))
            setText('')
            setPhoto(undefined)
          }}
          className={`h-11 rounded-[10px] px-4 text-[15px] font-bold ${text.trim() ? 'bg-navy text-white' : 'bg-line text-muted'}`}
        >
          Ask office for a quote
        </button>
      </div>
    </Card>
  )
}

// ---------------- Review & send ----------------

function SendPanel({
  visit,
  work,
  update,
  reset,
  areas,
  guide,
  book,
  onPreview,
  onGoTo,
}: {
  visit: Visit
  work: VisitWork
  update: Update
  reset: () => void
  areas: Area[]
  guide: Map<string, GuideRow>
  book: Map<string, PriceBookRow>
  onPreview: () => void
  onGoTo: (s: Section, target?: string) => void
}) {
  const blockers = sendBlockers(work, areas, guide, tradeLabel)
  const ids = selectedFindings(work)
  const byRating = (r: string) => ids.filter((id) => guide.get(id)?.rating === r).length
  const redTotal = ids
    .map((id) => guide.get(id)!)
    .filter((g) => g.rating === 'RED' && g.pricebookCode && book.has(g.pricebookCode))
    .reduce((a, g) => a + priceLine(book.get(g.pricebookCode)!, visit.customer).price, 0)
  const okCount = areas.filter((a) => work.areas[a.key]?.ok).length

  return (
    <>
      <h2 className="font-display text-2xl font-bold">Review &amp; send</h2>
      <Card className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
        <Count n={okCount} label="checked OK" color="#1E7B45" />
        <Count n={byRating('RED')} label="red · fix now" color="#A3261B" />
        <Count n={byRating('ORANGE')} label="orange · 6 months" color="#6B4700" />
        <Count n={byRating('YELLOW')} label="yellow · 12 months" color="#174F8C" />
        <Count n={byRating('GREEN')} label="green · monitor" color="#1E5C36" />
      </Card>
      <Card className="flex flex-col gap-1.5 text-[15px]">
        <div>
          Red items offered today: <b>{money(redTotal)}</b> <span className="text-muted">(pre-added to the customer&apos;s cart)</span>
        </div>
        <div>
          Quote requests for the office: <b>{work.quoteRequests.length}</b>
        </div>
      </Card>

      {blockers.length > 0 ? (
        <Card className="flex flex-col gap-2 border-2 border-alert">
          <div className="text-base font-bold text-alert">Can&apos;t send yet</div>
          {blockers.map((b) => (
            <div key={b.text} className="flex items-center justify-between gap-3 border-t border-line pt-2 first-of-type:border-0">
              <span className="text-sm text-body">{b.text}</span>
              <button
                type="button"
                onClick={() => onGoTo(b.trade, b.target)}
                className="h-11 shrink-0 rounded-[10px] bg-navy px-3 text-sm font-bold text-white"
              >
                Take me there
              </button>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="border-2 border-success text-base font-bold text-success">
          ✓ All three trades are done and every red item has a photo.
        </Card>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onPreview} className="h-[52px] rounded-xl border-2 border-navy bg-white text-[17px] font-bold text-navy">
          Preview customer report
        </button>
        <button
          type="button"
          disabled={blockers.length > 0}
          onClick={() => update((w) => ({ ...w, sentAt: new Date().toISOString() }))}
          className={`h-[52px] rounded-xl text-[17px] font-bold ${blockers.length ? 'bg-line text-muted' : 'bg-approve text-white'}`}
        >
          Close check-up &amp; send report
        </button>
      </div>
      {work.sentAt && (
        <Card className="text-sm text-body">
          Check-up closed at {new Date(work.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Texting the customer
          their link comes with the database step — for now nothing is sent.
        </Card>
      )}
      <button
        type="button"
        onClick={() => {
          if (confirm('Clear everything recorded on this visit?')) reset()
        }}
        className="h-11 self-center px-3 text-sm font-semibold text-link"
      >
        Start this visit over
      </button>
    </>
  )
}

function Count({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-[26px] font-bold" style={{ color }}>
        {n}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}
