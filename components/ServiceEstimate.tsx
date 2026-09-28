'use client'

import { useState } from 'react'
import { membership } from '@/config/business'
import { legal } from '@/config/legal'
import { money } from '@/lib/pricing'
import type { EstimateOption, EstimateView } from '@/lib/views'
import SignaturePad from './SignaturePad'
import { ApproveButton, BottomBar, Card, DoneCard, Header, LineItems, LinkButton, PhotoPlaceholder, SectionTitle } from './ui'

type Screen = 'est' | 'approve' | 'done'

export default function ServiceEstimate({ estimate }: { estimate: EstimateView }) {
  const firstKey = estimate.options[0]?.key
  const [screen, setScreen] = useState<Screen>('est')
  const [joinToggle, setJoin] = useState(false)
  const [pick, setPick] = useState(firstKey)
  const [signed, setSigned] = useState(false)

  const go = (s: Screen) => {
    setScreen(s)
    if (s !== 'approve') setSigned(false)
    window.scrollTo(0, 0)
  }

  // Existing members always get member prices; non-members get them by joining today.
  const member = estimate.alreadyMember || joinToggle
  const joiningToday = !estimate.alreadyMember && joinToggle
  const fee = member ? estimate.serviceCall.member : estimate.serviceCall.standard
  const feeSave = estimate.serviceCall.standard - estimate.serviceCall.member
  const priceOf = (o: EstimateOption) => (member ? o.member : o.standard)

  const p = estimate.options.find((o) => o.key === pick) ?? estimate.options[0]
  const save = p.standard - p.member + feeSave
  const total = priceOf(p) + fee

  const heading = screen === 'done' ? 'You’re all set' : screen === 'approve' ? 'Review and approve' : 'Your estimate'

  return (
    <>
      <Header tagline="HOME SERVICES" title={heading} sub={`${estimate.address} · ${estimate.dateText} · by ${estimate.techName}`} />

      {screen === 'est' && (
        <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 pt-4 pb-[120px]">
          <div className="flex flex-col overflow-hidden rounded-xl bg-white">
            <div className="h-1" style={{ background: estimate.tradeColor }} />
            <div className="flex gap-3 px-4 py-3.5">
              <PhotoPlaceholder label="Photo of the problem" />
              <div className="flex flex-col gap-1">
                <div className="text-xs font-bold tracking-[0.06em] text-muted">WHAT WE FOUND</div>
                <div className="text-base leading-tight font-bold">{estimate.found.title}</div>
                <div className="text-sm leading-[1.4] text-body">{estimate.found.detail}</div>
              </div>
            </div>
          </div>

          {!estimate.alreadyMember && (
            <button
              type="button"
              role="switch"
              aria-checked={joinToggle}
              onClick={() => setJoin(!joinToggle)}
              className={`flex items-center gap-3.5 rounded-xl border-2 px-4 py-3.5 text-left text-navy ${joinToggle ? 'border-success bg-success-bg' : 'border-edge bg-white'}`}
            >
              <div className="flex grow flex-col gap-1">
                <div className="text-base font-bold">Join MVP Club today — {money(membership.monthly)}/month</div>
                <div className="text-sm leading-[1.35] text-body">
                  {joinToggle
                    ? `Member prices applied. You save ${money(save)} on this visit.`
                    : `Members pay ${money(estimate.serviceCall.member)} for the service call and less on repairs: save ${money(save)} today.`}
                </div>
              </div>
              <div className={`box-border flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-[3px] ${joinToggle ? 'justify-end bg-success' : 'justify-start bg-edge'}`}>
                <div className="size-6 rounded-full bg-white" />
              </div>
            </button>
          )}

          <SectionTitle>PICK AN OPTION</SectionTitle>
          {estimate.options.map((o) => {
            const on = o.key === p.key
            const discounted = o.member < o.standard
            const note = o.laterCredit > 0 && !discounted
              ? `${money(o.laterCredit)} member credit after ${membership.creditWaitDays} days`
              : member ? 'member price' : `members ${money(o.member)}`
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setPick(o.key)}
                aria-pressed={on}
                className={`flex flex-col gap-2 rounded-xl border-2 bg-white px-4 py-3.5 text-left text-navy ${on ? 'border-navy' : 'border-line'}`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="box-border flex size-[22px] items-center justify-center rounded-full border-2 border-navy">
                      <div className={`size-3 rounded-full ${on ? 'bg-navy' : ''}`} />
                    </div>
                    <div className="text-[17px] font-bold">{o.name}</div>
                  </div>
                  {o.mostChosen && <span className="rounded-full bg-[#FFF1CC] px-2 py-0.5 text-xs font-bold text-[#6B4700]">Most chosen</span>}
                </div>
                <div className="text-[15px] font-semibold">{o.what}</div>
                <div className="text-sm leading-[1.4] text-body">{o.why}</div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-2xl font-bold">{money(priceOf(o))}</span>
                  {member && discounted && <span className="text-[13px] text-muted line-through">{money(o.standard)}</span>}
                  <span className="text-[13px] text-muted">{note}</span>
                </div>
              </button>
            )
          })}
          <div className="text-center text-xs text-muted">Sample job · prices from the MVP price book</div>

          <BottomBar>
            <div className="flex grow flex-col">
              <div className="text-base font-bold">Today: {money(total)}</div>
              <div className="text-[13px] text-muted">
                {p.name} + {money(fee)} service call
              </div>
            </div>
            <button type="button" onClick={() => go('approve')} className="h-12 shrink-0 rounded-[10px] bg-approve px-[18px] text-base font-bold text-white">
              Review &amp; approve
            </button>
          </BottomBar>
        </main>
      )}

      {screen === 'approve' && (
        <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 pt-4 pb-6">
          <LineItems
            lines={[
              { label: `${p.name} — ${p.what}`, amount: priceOf(p) },
              { label: 'Service call', amount: fee },
            ]}
            footer={
              <>
                <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-bold">
                  <span>Due today</span>
                  <span>{money(total)}</span>
                </div>
                {joiningToday && (
                  <div className="rounded-lg bg-success-bg px-3 py-2.5 text-sm leading-[1.4]">
                    <b>MVP Club membership</b> {legal.membershipTerms(membership.monthly, membership.firstTermMonths)} You saved {money(save)} on this visit.
                  </div>
                )}
              </>
            }
          />
          <Card className="flex flex-col gap-2.5">
            <div className="text-base font-bold">Sign to approve</div>
            <SignaturePad onChange={setSigned} />
            <div className="text-xs leading-[1.45] text-muted">{legal.emergencyWaiver}</div>
          </Card>
          <ApproveButton ready={signed} label={signed ? `Approve ${money(total)}` : 'Sign to continue'} onClick={() => signed && go('done')} />
          <LinkButton onClick={() => go('est')}>Back to options</LinkButton>
        </main>
      )}

      {screen === 'done' && (
        <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 py-6">
          <DoneCard
            line={`${joiningToday ? 'Welcome to MVP Club. ' : ''}Your tech is starting the work now. You’ll get the invoice and a copy of this approval by text and email.`}
          />
          <button
            type="button"
            onClick={() => {
              setJoin(false)
              setPick(firstKey)
              go('est')
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
