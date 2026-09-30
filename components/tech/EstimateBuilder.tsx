'use client'

import { useMemo, useState } from 'react'
import { estimateOptions as MAX_OPTIONS, membership, serviceCallCode, tradeInfo } from '@/config/business'
import { money, priceLines } from '@/lib/pricing'
import {
  estimateBlockers,
  isPickable,
  newEstimate,
  optionWhat,
  type EstimateOptionWork,
  type EstimateWork,
  type Visit,
  type VisitWork,
} from '@/lib/tech'
import type { Customer, PriceBookRow } from '@/lib/types'
import { Card } from '../ui'
import PhotoButton from './PhotoButton'
import SendControls, { type SendState } from './SendControls'

type Update = (fn: (w: VisitWork) => VisitWork) => void

const presets = ['Repair', 'Repair + tune-up', 'Replace']
const inputCls = 'h-11 rounded-[10px] border border-edge bg-white px-3 text-[15px] text-navy'
const memberText = (r: PriceBookRow) => (r.memberPrice === 0 ? 'free for members' : `members ${money(r.memberPrice)}`)

export default function EstimateBuilder({
  visit,
  work,
  update,
  book,
  highlight,
  onPreview,
  onGoTo,
  send,
}: {
  visit: Visit
  work: VisitWork
  update: Update
  book: Map<string, PriceBookRow>
  highlight: string | null
  onPreview: () => void
  onGoTo: (target: string) => void
  send: SendState
}) {
  const est = work.estimate ?? newEstimate()
  const setEst = (fn: (e: EstimateWork) => EstimateWork) => update((w) => ({ ...w, estimate: fn(w.estimate ?? newEstimate()) }))
  const setOption = (key: string, patch: Partial<EstimateOptionWork>) =>
    setEst((e) => ({ ...e, options: e.options.map((o) => (o.key === key ? { ...o, ...patch } : o)) }))

  const trade = visit.trade ?? 'HVAC'
  const fee = book.get(serviceCallCode[trade])!
  const isMember = visit.customer.isMember
  // A non-member who joins today is a brand-new member (no replacement credit yet).
  const asMember: Customer = isMember ? visit.customer : { isMember: true, memberSince: new Date().toISOString().slice(0, 10) }
  const taskOf = (c: string) => book.get(c)?.task ?? c
  const blockers = estimateBlockers(work.estimate)
  const lit = (id: string) => (highlight === id ? 'ring-4 ring-approve' : '')

  return (
    <>
      <h2 className="font-display text-2xl font-bold">Estimate</h2>

      <Card className={`flex flex-col gap-1 border-l-4 ${isMember ? 'border-success' : 'border-[#F2B705]'}`}>
        <div className="text-base font-bold">{isMember ? 'Member' : 'Not a member'}</div>
        <div className="text-sm text-body">
          {isMember
            ? `Member prices apply and the service call is ${money(fee.memberPrice)}.`
            : `Service call ${money(fee.standardPrice)}. On their page the customer can switch on “Join MVP Club today — ${money(membership.monthly)}/month” to get member prices and the ${money(fee.memberPrice)} service call. The ${money(fee.standardPrice)} is never credited toward the repair.`}
        </div>
      </Card>

      <Card id="est-found" className={`flex scroll-mt-4 flex-col gap-2.5 ${lit('est-found')}`}>
        <div className="text-base font-bold">What we found</div>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Headline the customer sees
          <input
            value={est.found.title}
            placeholder="e.g. Your AC isn't cooling because the start capacitor failed."
            onChange={(e) => setEst((x) => ({ ...x, found: { ...x.found, title: e.target.value } }))}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          More detail in plain words (optional)
          <textarea
            value={est.found.detail}
            rows={2}
            placeholder="e.g. The outdoor unit can't start without it. The contactor is also worn."
            onChange={(e) => setEst((x) => ({ ...x, found: { ...x.found, detail: e.target.value } }))}
            className="rounded-[10px] border border-edge bg-white px-3 py-2 text-[15px] text-navy"
          />
        </label>
        <PhotoButton label="Photo of the problem" photo={est.found.photo} onPhoto={(p) => setEst((x) => ({ ...x, found: { ...x.found, photo: p } }))} />
      </Card>

      <h3 className="mt-1 font-display text-lg font-bold tracking-[0.06em] text-muted">OPTIONS FOR THE CUSTOMER</h3>
      {est.options.map((o, i) => (
        <OptionEditor
          key={o.key}
          index={i}
          option={o}
          trade={trade}
          book={book}
          isMember={isMember}
          asMember={asMember}
          taskOf={taskOf}
          className={lit(`est-${o.key}`)}
          onChange={(patch) => setOption(o.key, patch)}
          onMostChosen={() =>
            setEst((e) => ({ ...e, options: e.options.map((x) => ({ ...x, mostChosen: x.key === o.key ? !o.mostChosen : false })) }))
          }
          onRemove={() => setEst((e) => ({ ...e, options: e.options.filter((x) => x.key !== o.key) }))}
        />
      ))}

      <Card id="est-add" className={`flex scroll-mt-4 flex-wrap items-center gap-2 ${lit('est-add')}`}>
        {est.options.length < MAX_OPTIONS ? (
          <>
            <span className="text-[15px] font-semibold">Add option {est.options.length + 1} of {MAX_OPTIONS}:</span>
            {[...presets, 'Other'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  setEst((e) => ({
                    ...e,
                    options: [
                      ...e.options,
                      { key: `o${Date.now()}`, name: name === 'Other' ? '' : name, what: '', why: '', mostChosen: false, codes: [] },
                    ],
                  }))
                }
                className="h-11 rounded-[10px] border border-navy bg-white px-3 text-[15px] font-semibold text-navy"
              >
                + {name}
              </button>
            ))}
          </>
        ) : (
          <span className="text-sm text-muted">✓ All {MAX_OPTIONS} options added.</span>
        )}
      </Card>

      {blockers.length > 0 ? (
        <Card className="flex flex-col gap-2 border-2 border-alert">
          <div className="text-base font-bold text-alert">Can&apos;t send yet</div>
          {blockers.map((b) => (
            <div key={b.text} className="flex items-center justify-between gap-3 border-t border-line pt-2 first-of-type:border-0">
              <span className="text-sm text-body">{b.text}</span>
              <button type="button" onClick={() => onGoTo(b.target)} className="h-11 shrink-0 rounded-[10px] bg-navy px-3 text-sm font-bold text-white">
                Take me there
              </button>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="border-2 border-success text-base font-bold text-success">✓ Ready to show the customer.</Card>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={est.options.length === 0}
          onClick={onPreview}
          className={`h-[52px] rounded-xl border-2 text-[17px] font-bold ${est.options.length ? 'border-navy bg-white text-navy' : 'border-line bg-white text-muted'}`}
        >
          Preview customer estimate
        </button>
        <SendControls label="Send estimate" blocked={blockers.length > 0} send={send} work={work} />
      </div>
    </>
  )
}

function OptionEditor({
  index,
  option: o,
  trade,
  book,
  isMember,
  asMember,
  taskOf,
  className,
  onChange,
  onMostChosen,
  onRemove,
}: {
  index: number
  option: EstimateOptionWork
  trade: string
  book: Map<string, PriceBookRow>
  isMember: boolean
  asMember: Customer
  taskOf: (c: string) => string
  className: string
  onChange: (patch: Partial<EstimateOptionWork>) => void
  onMostChosen: () => void
  onRemove: () => void
}) {
  const [picking, setPicking] = useState(o.codes.length === 0)
  const rows = o.codes.map((c) => book.get(c)!).filter(Boolean)
  const nonMember = priceLines(rows, { isMember: false })
  const member = priceLines(rows, asMember)
  const counts = [...o.codes.reduce((m, c) => m.set(c, (m.get(c) ?? 0) + 1), new Map<string, number>())]
  const setQty = (code: string, n: number) => {
    const others = o.codes.filter((c) => c !== code)
    onChange({ codes: [...others, ...Array(Math.max(0, n)).fill(code)] })
  }

  return (
    <div id={`est-${o.key}`} className={`flex scroll-mt-4 flex-col overflow-hidden rounded-xl bg-white ${className}`}>
      <div className="h-1" style={{ background: tradeInfo[trade]?.color }} />
      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{index + 1}</span>
          <input value={o.name} placeholder="Option name" onChange={(e) => onChange({ name: e.target.value })} className={`${inputCls} grow font-bold`} />
          <button
            type="button"
            aria-pressed={o.mostChosen}
            onClick={onMostChosen}
            className={`h-11 rounded-[10px] border px-3 text-sm font-semibold ${o.mostChosen ? 'border-[#6B4700] bg-[#FFF1CC] text-[#6B4700]' : 'border-edge bg-white text-navy'}`}
          >
            {o.mostChosen ? '★ Most chosen' : '☆ Most chosen'}
          </button>
          <button type="button" onClick={onRemove} className="h-11 px-2 text-sm font-semibold text-link">
            Remove
          </button>
        </div>

        {/* Items from the price book */}
        <div className="flex flex-col gap-1.5">
          {counts.map(([code, n]) => {
            const r = book.get(code)!
            return (
              <div key={code} className="flex items-center gap-2 rounded-[10px] border border-line px-3 py-1.5">
                <div className="flex grow flex-col">
                  <span className="text-[15px] font-semibold">{r.task}</span>
                  <span className="text-xs text-muted">
                    🔒 {r.code} · {money(r.standardPrice)}
                    {r.creditTier ? ` · ${r.creditTier} replacement` : ` · ${memberText(r)}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="One less" onClick={() => setQty(code, n - 1)} className="size-11 rounded-[10px] border border-edge text-lg font-bold">
                    −
                  </button>
                  <span className="w-6 text-center font-bold">{n}</span>
                  <button type="button" aria-label="One more" onClick={() => setQty(code, n + 1)} className="size-11 rounded-[10px] border border-edge text-lg font-bold">
                    +
                  </button>
                </div>
              </div>
            )
          })}
          {picking ? (
            <PriceBookPicker
              trade={trade}
              book={book}
              chosen={o.codes}
              onAdd={(code) => onChange({ codes: [...o.codes, code] })}
              onDone={() => setPicking(false)}
            />
          ) : (
            <button type="button" onClick={() => setPicking(true)} className="h-11 self-start rounded-[10px] border border-navy bg-white px-3 text-[15px] font-semibold text-navy">
              + Add items from the price book
            </button>
          )}
        </div>

        <label className="flex flex-col gap-1 text-xs text-muted">
          What&apos;s included (short line the customer sees — leave empty to use the item names)
          <input value={o.what} placeholder={optionWhat({ ...o, what: '' }, taskOf) || 'e.g. Replace capacitor and contactor'} onChange={(e) => onChange({ what: e.target.value })} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Why pick this option (plain words)
          <textarea
            value={o.why}
            rows={2}
            placeholder="e.g. Gets your AC cooling today. Parts are on the truck."
            onChange={(e) => onChange({ why: e.target.value })}
            className="rounded-[10px] border border-edge bg-white px-3 py-2 text-[15px] text-navy"
          />
        </label>

        {rows.length > 0 && (
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-[10px] bg-page px-3 py-2 text-sm">
            <span>
              {isMember ? 'Member price' : 'Price'}: <b className="text-base">{money(isMember ? member.price : nonMember.price)}</b>
            </span>
            <span className="text-muted">
              {isMember
                ? member.price < nonMember.price
                  ? `regular ${money(nonMember.price)}`
                  : ''
                : member.price < nonMember.price
                  ? `if they join today: ${money(member.price)}`
                  : member.laterCredit
                    ? `${money(member.laterCredit)} member credit after ${membership.creditWaitDays} days`
                    : 'same price for members'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function PriceBookPicker({
  trade,
  book,
  chosen,
  onAdd,
  onDone,
}: {
  trade: string
  book: Map<string, PriceBookRow>
  chosen: string[]
  onAdd: (code: string) => void
  onDone: () => void
}) {
  const [tradeFilter, setTradeFilter] = useState(trade)
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const list = [...book.values()].filter(
      (r) =>
        isPickable(r) &&
        (tradeFilter === 'All' || r.trade === tradeFilter) &&
        words.every((w) => `${r.task} ${r.code} ${r.category}`.toLowerCase().includes(w)),
    )
    const byCat = new Map<string, PriceBookRow[]>()
    for (const r of list) byCat.set(r.category, [...(byCat.get(r.category) ?? []), r])
    return [...byCat]
  }, [book, tradeFilter, q])

  return (
    <div className="flex flex-col gap-2 rounded-[10px] border-2 border-navy p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} placeholder="Search the price book (e.g. capacitor)" onChange={(e) => setQ(e.target.value)} className={`${inputCls} min-w-0 grow`} />
        <button type="button" onClick={onDone} className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white">
          Done
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['HVAC', 'Plumbing', 'Electrical', 'All'].map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tradeFilter === t}
            onClick={() => setTradeFilter(t)}
            className={`h-11 rounded-[10px] border px-3 text-sm font-semibold ${tradeFilter === t ? 'border-navy bg-navy text-white' : 'border-edge bg-white text-navy'}`}
          >
            {tradeInfo[t]?.label ?? t}
          </button>
        ))}
      </div>
      <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
        {groups.length === 0 && <div className="text-sm text-muted">Nothing matches. Not in the price book? Ask the office for a quote.</div>}
        {groups.map(([cat, list]) => (
          <div key={cat} className="flex flex-col gap-1">
            <div className="text-xs font-bold tracking-[0.06em] text-muted uppercase">{cat}</div>
            {list.map((r) => {
              const n = chosen.filter((c) => c === r.code).length
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => onAdd(r.code)}
                  className="flex min-h-11 items-center gap-3 rounded-[10px] border border-line bg-white px-3 py-1.5 text-left"
                >
                  <span className="flex grow flex-col">
                    <span className="text-[15px]">{r.task}</span>
                    <span className="text-xs text-muted">
                      {r.code}
                      {r.notes ? ` · ${r.notes}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm">
                    <b>{money(r.standardPrice)}</b>
                    <br />
                    <span className="text-xs text-muted">{r.creditTier ? `${r.creditTier} credit` : memberText(r)}</span>
                  </span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy text-lg font-bold text-white">
                    {n > 0 ? n : '+'}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
