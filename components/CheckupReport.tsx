'use client'

import { useState } from 'react'
import { company, ratings, visitSlots } from '@/config/business'
import { legal } from '@/config/legal'
import { money } from '@/lib/pricing'
import type { ReportItem, ReportView } from '@/lib/views'
import SignaturePad from './SignaturePad'
import VisitPicker, { type VisitDay } from './VisitPicker'
import {
  ApproveButton,
  BottomBar,
  Card,
  DoneCard,
  Header,
  LineItems,
  LinkButton,
  PhotoPlaceholder,
  SectionTitle,
} from './ui'

type Screen = 'report' | 'approve' | 'done'

// RED items that have a price come pre-added to the cart.
const startCart = (items: ReportItem[]) =>
  Object.fromEntries(items.filter((i) => i.rating === 'RED' && i.price !== null).map((i) => [i.key, true]))

export default function CheckupReport({ report }: { report: ReportView }) {
  const [screen, setScreen] = useState<Screen>('report')
  const [added, setAdded] = useState<Record<string, boolean>>(() => startCart(report.items))
  const [remind, setRemind] = useState<Record<string, boolean>>({})
  const [day, setDay] = useState<VisitDay | null>(null)
  const [slot, setSlot] = useState(visitSlots[0].id)
  const [signed, setSigned] = useState(false)

  const go = (s: Screen) => {
    setScreen(s)
    if (s !== 'approve') setSigned(false)
    window.scrollTo(0, 0)
  }

  const nowList = report.items.filter((i) => i.rating === 'RED')
  const laterList = report.items
    .filter((i) => i.rating === 'ORANGE' || i.rating === 'YELLOW')
    .sort((a, b) => (a.rating === b.rating ? 0 : a.rating === 'ORANGE' ? -1 : 1))
  const watchList = report.items.filter((i) => i.rating === 'GREEN')

  const cart = report.items.filter((i) => added[i.key] && i.price !== null)
  const total = cart.reduce((a, i) => a + (i.price ?? 0), 0)
  const save = cart.reduce((a, i) => a + ((i.standard ?? 0) - (i.price ?? 0)), 0)
  const saveLine = save > 0 ? `You save ${money(save)} as a member` : ''
  const ready = signed && day !== null
  const slotName = visitSlots.find((s) => s.id === slot)?.short ?? ''

  const title = screen === 'report' ? 'Your home check-up' : screen === 'approve' ? 'Review and approve' : "You're all set"
  const sub = screen === 'report' ? `${report.address} · ${report.dateText} · by ${report.techName}` : undefined

  return (
    <>
      <Header tagline="CLUB" title={title} sub={sub} />

      {screen === 'report' && (
        <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 pt-4 pb-[120px]">
          <Card className="grid grid-cols-3 gap-2 text-center">
            <Stat n={report.checkedOk.length} label="checked OK" color="#1E7B45" />
            <Stat n={nowList.length} label="need attention now" color="#A3261B" />
            <Stat n={laterList.length} label="to plan for" color="#1B5FA8" />
          </Card>

          {nowList.length > 0 && <SectionTitle>NEEDS ATTENTION NOW</SectionTitle>}
          {nowList.map((item) => (
            <ItemCard key={item.key} item={item} on={!!added[item.key]} onAdd={() => setAdded({ ...added, [item.key]: !added[item.key] })} />
          ))}

          {laterList.length > 0 && <SectionTitle>PLAN FOR THESE</SectionTitle>}
          {laterList.map((item) => (
            <ItemCard
              key={item.key}
              item={item}
              on={!!added[item.key]}
              onAdd={() => setAdded({ ...added, [item.key]: !added[item.key] })}
              reminded={!!remind[item.key]}
              onRemind={() => setRemind({ ...remind, [item.key]: !remind[item.key] })}
            />
          ))}

          {watchList.length > 0 && (
            <Card className="flex flex-col gap-1.5">
              <div className="text-base font-bold">We&apos;ll keep an eye on ({watchList.length})</div>
              {watchList.map((i) => (
                <div key={i.key} className="text-sm leading-normal text-body">
                  <b>{i.title}</b> — {i.reason}
                </div>
              ))}
            </Card>
          )}

          <Card className="flex flex-col gap-1.5">
            <div className="text-base font-bold">Checked and OK ({report.checkedOk.length})</div>
            <div className="text-sm leading-normal text-body">{report.checkedOk.join(' · ')}</div>
          </Card>
          <div className="text-center text-xs text-muted">Sample home · items and prices from the MVP Inspection Guide and price book</div>

          {cart.length > 0 && (
            <BottomBar>
              <div className="flex grow flex-col">
                <div className="text-base font-bold">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} · {money(total)}
                </div>
                {saveLine && <div className="text-[13px] font-semibold text-success">{saveLine}</div>}
              </div>
              <button type="button" onClick={() => go('approve')} className="h-12 shrink-0 rounded-[10px] bg-approve px-[18px] text-base font-bold text-white">
                Review &amp; approve
              </button>
            </BottomBar>
          )}
        </main>
      )}

      {screen === 'approve' && (
        <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 pt-4 pb-6">
          <p className="text-[15px] leading-snug text-body">
            Three quick steps: check your items, pick a day, then sign. You pay only after the work is done.
          </p>

          <Card className="flex flex-col gap-3">
            <StepTitle n={1}>Your items</StepTitle>
            {cart.map((c) => (
              <div key={c.key} className="flex justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{c.title}</span>
                  {c.detail && <span className="text-[13px] leading-snug text-muted">{c.detail}</span>}
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-[15px] font-bold">{c.price === 0 ? 'Included' : money(c.price ?? 0)}</span>
                  {c.standard !== null && c.price !== null && c.standard > c.price && (
                    <span className="text-[13px] text-muted">
                      regular <span className="line-through">{money(c.standard)}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-bold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
            {save > 0 && (
              <div className="text-[13px] font-semibold text-success">
                Your member prices save you {money(save)} compared with regular prices.
              </div>
            )}
          </Card>

          <VisitPicker day={day} slot={slot} onDay={setDay} onSlot={setSlot} title={<StepTitle n={2}>Pick a day for the work</StepTitle>} />

          <Card className="flex flex-col gap-2.5">
            <StepTitle n={3}>Sign to approve</StepTitle>
            <SignaturePad onChange={setSigned} />
            <div className="text-xs leading-[1.45] text-muted">{legal.checkupApproval}</div>
          </Card>
          <ApproveButton
            ready={ready}
            label={ready ? `Approve ${money(total)}` : day === null ? 'Step 2: pick a day to continue' : 'Step 3: sign to continue'}
            onClick={() => ready && go('done')}
          />
          <LinkButton onClick={() => go('report')}>Back to report</LinkButton>
        </main>
      )}

      {screen === 'done' && (
        <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 py-6">
          <DoneCard
            line={`We will text you to confirm ${day ? `${day.long} ${slotName}` : ''}. A copy of your approval is on its way by email.`}
          />
          <LineItems lines={cart.map((c) => ({ label: c.title, amount: c.price ?? 0 }))} />
          <div className="text-center text-sm leading-[1.45] text-muted">
            We&apos;ll remind you about the items you saved for later. Questions? Call {company.phone}.
          </div>
          <button
            type="button"
            onClick={() => {
              setAdded(startCart(report.items))
              setRemind({})
              setDay(null)
              setSlot(visitSlots[0].id)
              go('report')
            }}
            className="h-11 rounded-[10px] border border-edge bg-white text-[15px] font-semibold text-navy"
          >
            Start the demo over
          </button>
        </main>
      )}
    </>
  )
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-base font-bold">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-sm text-white">{n}</span>
      {children}
    </div>
  )
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="font-display text-[26px] font-bold" style={{ color }}>
        {n}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

function ItemCard({
  item,
  on,
  onAdd,
  reminded,
  onRemind,
}: {
  item: ReportItem
  on: boolean
  onAdd: () => void
  reminded?: boolean
  onRemind?: () => void
}) {
  const badge = ratings[item.rating]
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white">
      <div className="h-1" style={{ background: item.tradeColor }} />
      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        <div className="flex gap-3">
          <PhotoPlaceholder label="Photo from the check-up" src={item.photo} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: badge.bg, color: badge.fg }}>
                {badge.badge}
              </span>
              <span className="text-xs text-muted">{item.tradeLabel}</span>
            </div>
            <div className="text-base leading-tight font-bold">{item.title}</div>
          </div>
        </div>
        <div className="text-sm leading-[1.4] text-body">{item.reason}</div>
        <div className="flex items-center justify-between gap-2">
          {item.price === null ? (
            <div className="text-sm font-semibold text-muted">We&apos;ll quote this after a closer look</div>
          ) : (
            <div className="flex flex-col">
              <div className="font-display text-2xl leading-none font-bold">{item.price === 0 ? 'Included' : money(item.price)}</div>
              <div className="text-xs text-muted">
                {item.standard !== null && item.standard > item.price && <span className="line-through">{money(item.standard)}</span>}{' '}
                {item.note}
              </div>
            </div>
          )}
          <div className="flex shrink-0 gap-2">
            {onRemind && (
              <button
                type="button"
                onClick={onRemind}
                className={`h-11 rounded-[10px] border border-edge px-3 text-sm font-semibold text-navy ${reminded ? 'bg-[#E3EEFB]' : 'bg-white'}`}
              >
                {reminded ? 'Reminder set' : 'Remind me'}
              </button>
            )}
            {item.price !== null && (
              <button
                type="button"
                onClick={onAdd}
                aria-pressed={on}
                className={`h-11 rounded-[10px] border-2 border-navy text-base font-bold ${onRemind ? 'min-w-[88px]' : 'min-w-[116px]'} ${on ? 'bg-navy text-white' : 'bg-white text-navy'}`}
              >
                {on ? 'Added' : 'Add'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
