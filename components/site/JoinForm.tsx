'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import SignaturePad from '@/components/SignaturePad'
import { finishJoin, saveJoinStep, type JoinData } from '@/app/join/actions'
import { membership, membershipPrice } from '@/config/business'
import { legal } from '@/config/legal'
import { site } from '@/config/site'
import { money } from '@/lib/pricing'

const STEPS = ['You', 'Your home', 'Your plan', 'Sign']

const input = 'h-12 w-full rounded-lg border border-edge bg-white px-3 text-[17px] outline-none focus:border-navy'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[15px] font-semibold">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </label>
  )
}

export default function JoinForm({ initialPlan, memberCall }: { initialPlan: 'monthly' | 'yearly'; memberCall: string }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inArea, setInArea] = useState<boolean | undefined>()
  const [trap, setTrap] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [pending, start] = useTransition()
  const [d, setD] = useState<JoinData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    zip: '',
    systems: 1,
    plan: initialPlan,
    preferredTime: site.preferredTimes[site.preferredTimes.length - 1],
    notes: '',
  })
  const set = <K extends keyof JoinData>(k: K, v: JoinData[K]) => setD((x) => ({ ...x, [k]: v }))
  const priceText = (plan: 'monthly' | 'yearly') => `${money(membershipPrice(plan, d.systems))}/${plan === 'monthly' ? 'month' : 'year'}`

  const next = () => {
    setError(null)
    start(async () => {
      const r = await saveJoinStep(step + 1, d, trap)
      if (!r.ok) return setError(r.error)
      if (r.inArea !== undefined) setInArea(r.inArea)
      setStep((s) => s + 1)
      window.scrollTo({ top: 0 })
    })
  }
  const finish = () => {
    setError(null)
    start(async () => {
      const r = await finishJoin(d, signature, agreed)
      if (!r.ok) return setError(r.error)
      setDone(true)
      window.scrollTo({ top: 0 })
    })
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-success-bg p-5">
          <div className="font-display text-[28px] leading-tight font-bold text-success">Welcome to MVP Club, {d.firstName}!</div>
          <p className="mt-2 text-body">We got your sign-up. Here&apos;s what happens next:</p>
        </div>
        <ol className="flex flex-col gap-3 rounded-xl bg-white p-5 ring-1 ring-line">
          {[
            `Within one business day we call or text you at ${d.phone} to schedule your first check-up.`,
            'We text you a secure link to set up payment. No card is taken on this website.',
            'Your tech checks your heating & cooling, plumbing and electrical, and you get the report on your phone.',
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white">{i + 1}</span>
              <span className="pt-1 text-body">{t}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">
          Questions? Call or text {site.phoneDisplay}, {site.hours.days} {site.hours.open}–{site.hours.close}.
        </p>
        <Link href="/" className="text-[15px] font-semibold text-link">
          ← Back to the home page
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <ol className="grid grid-cols-4 gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-approve' : 'bg-line'}`} />
            <span className={`text-xs font-semibold ${i === step ? 'text-navy' : 'text-muted'}`}>
              {i + 1}. {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-line">
        {step === 0 && (
          <>
            <h2 className="font-display text-2xl font-bold">Let&apos;s start with you</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input className={input} autoComplete="given-name" value={d.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </Field>
              <Field label="Last name">
                <input className={input} autoComplete="family-name" value={d.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </Field>
            </div>
            <Field label="Mobile phone" hint="We text your check-up reports and reminders here.">
              <input className={input} type="tel" inputMode="tel" autoComplete="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Email (optional)">
              <input className={input} type="email" autoComplete="email" value={d.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            {/* Hidden from people; bots fill it in. */}
            <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" name="company" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-2xl font-bold">Your home</h2>
            <Field label="Street address">
              <input className={input} autoComplete="street-address" value={d.street} onChange={(e) => set('street', e.target.value)} />
            </Field>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Field label="City">
                <input className={input} autoComplete="address-level2" value={d.city} onChange={(e) => set('city', e.target.value)} />
              </Field>
              <Field label="Zip">
                <input className={input} inputMode="numeric" autoComplete="postal-code" maxLength={5} value={d.zip} onChange={(e) => set('zip', e.target.value.replace(/\D/g, ''))} />
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">How many heating &amp; cooling systems?</span>
              <span className="-mt-1 text-sm text-muted">A furnace + AC that work together count as one system.</span>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: membership.maxSystems }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('systems', n)}
                    className={`h-12 rounded-lg border-2 text-lg font-bold ${d.systems === n ? 'border-navy bg-navy text-white' : 'border-line bg-white'}`}
                  >
                    {n === membership.maxSystems ? `${n}+` : n}
                  </button>
                ))}
              </div>
              <span className="text-sm text-muted">
                Membership covers one system; each extra one is +${membership.extraSystemMonthly}/month.
              </span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-2xl font-bold">Choose your plan</h2>
            {inArea === false && (
              <div className="rounded-lg bg-[#FFF1CC] p-3 text-[15px] text-[#6B4700]">
                Zip {d.zip} is just outside our usual area. You can still sign up — we&apos;ll confirm we can serve your home before anything starts.
              </div>
            )}
            {(['monthly', 'yearly'] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => set('plan', plan)}
                className={`flex items-center justify-between gap-3 rounded-xl border-2 p-4 text-left ${d.plan === plan ? 'border-approve bg-[#FBEDE6]' : 'border-line bg-white'}`}
              >
                <span className="flex flex-col">
                  <span className="text-lg font-bold">{plan === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                  <span className="text-sm text-muted">
                    {plan === 'monthly'
                      ? `First term ${membership.firstTermMonths} months, then month to month`
                      : `Pay once a year — save ${money(membershipPrice('monthly', d.systems) * 12 - membershipPrice('yearly', d.systems))}`}
                  </span>
                </span>
                <span className="font-display text-2xl font-bold whitespace-nowrap">{priceText(plan)}</span>
              </button>
            ))}
            <ul className="flex flex-col gap-1.5 text-[15px] text-body">
              <li>✓ Two full-home check-ups a year (spring and fall)</li>
              <li>✓ {memberCall} service calls and 15% off repairs</li>
              <li>✓ Credits toward replacements after {membership.creditWaitDays} days</li>
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-2xl font-bold">Review and sign</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
              <dt className="text-muted">Name</dt>
              <dd className="font-semibold">
                {d.firstName} {d.lastName}
              </dd>
              <dt className="text-muted">Phone</dt>
              <dd className="font-semibold">{d.phone}</dd>
              <dt className="text-muted">Home</dt>
              <dd className="font-semibold">
                {d.street}, {d.city} {d.zip}
              </dd>
              <dt className="text-muted">Plan</dt>
              <dd className="font-semibold">
                {priceText(d.plan)} · {d.systems} {d.systems === 1 ? 'system' : 'systems'}
              </dd>
            </dl>
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">Best time for your first check-up</span>
              <div className="flex flex-wrap gap-2">
                {site.preferredTimes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('preferredTime', t)}
                    className={`h-11 rounded-full border-2 px-4 text-[15px] font-semibold ${d.preferredTime === t ? 'border-navy bg-navy text-white' : 'border-line bg-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Anything we should know? (optional)">
              <textarea className={`${input} h-20 py-2`} value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Gate code, pets, a problem you've noticed…" />
            </Field>
            <p className="rounded-lg bg-page p-3 text-sm leading-[1.45] text-body">{legal.joinTerms(priceText(d.plan), membership.firstTermMonths)}</p>
            <label className="flex min-h-11 items-center gap-3 text-[15px] font-semibold">
              <input type="checkbox" className="size-6 accent-[#B8410F]" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />I agree to the membership terms above
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] font-semibold">Sign with your finger</span>
              <SignaturePad onChange={setSignature} />
            </div>
          </>
        )}

        {error && <div className="rounded-lg border-2 border-alert p-3 text-[15px] font-semibold text-alert">{error}</div>}

        <div className="flex gap-3 pt-1">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="h-14 rounded-xl border-2 border-line px-5 font-semibold" disabled={pending}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={next} disabled={pending} className="h-14 flex-1 rounded-xl bg-navy text-lg font-bold text-white disabled:opacity-60">
              {pending ? 'Saving…' : 'Continue'}
            </button>
          ) : (
            <button type="button" onClick={finish} disabled={pending} className="h-14 flex-1 rounded-xl bg-approve text-lg font-bold text-white disabled:opacity-60">
              {pending ? 'Saving…' : `Join MVP Club — ${priceText(d.plan)}`}
            </button>
          )}
        </div>
      </div>
      <p className="text-center text-sm text-muted">
        No card on this website. Prefer to talk? Call or text {site.phoneDisplay}.
      </p>
    </div>
  )
}
