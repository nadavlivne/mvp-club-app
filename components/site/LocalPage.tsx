import Link from 'next/link'
import { membership } from '@/config/business'
import { site } from '@/config/site'

// Shared blocks for the service and town pages.

export function PageHero({ eyebrow, title, intro, memberCall, regularCall }: { eyebrow: string; title: string; intro: string; memberCall: string; regularCall: string }) {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-12">
        <p className="font-display text-sm font-bold tracking-[0.2em] text-sub">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-[40px] leading-[1.02] font-bold md:text-[54px]">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-sub">{intro}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={`tel:${site.phoneHref}`} className="flex h-14 items-center justify-center rounded-xl bg-approve px-6 text-lg font-bold">
            Call {site.phoneDisplay}
          </a>
          <a href={`sms:${site.phoneHref}`} className="flex h-14 items-center justify-center rounded-xl bg-white/10 px-6 text-lg font-semibold ring-1 ring-white/30">
            Text us
          </a>
        </div>
        <p className="mt-4 text-sm text-sub">
          Service call {regularCall} · members {memberCall} · {site.hours.days} {site.hours.open}–{site.hours.close}
        </p>
      </div>
      <div className="flex h-2" aria-hidden>
        <div className="flex-1 bg-[#F2B705]" />
        <div className="flex-1 bg-[#2F8FE0]" />
        <div className="flex-1 bg-[#F2672A]" />
      </div>
    </section>
  )
}

export function CheckList({ title, items, color }: { title: string; items: string[]; color?: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-line">
      {color && <div className="h-1.5" style={{ background: color }} />}
      <div className="p-5">
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <ul className="mt-3 flex flex-col gap-2 text-[15px] text-body">
          {items.map((i) => (
            <li key={i} className="flex gap-2">
              <span className="text-success">✓</span>
              {i}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function MemberPitch({ memberCall, regularCall, text }: { memberCall: string; regularCall: string; text?: string }) {
  return (
    <section className="rounded-xl bg-navy p-6 text-white">
      <div className="font-display text-sm font-bold tracking-[0.2em] text-sub">MVP CLUB MEMBERS SAVE</div>
      <h2 className="mt-2 font-display text-[28px] leading-tight font-bold">
        ${membership.monthly}/month for two full-home check-ups a year
      </h2>
      {text && <p className="mt-2 max-w-2xl text-sub">{text}</p>}
      <ul className="mt-3 flex flex-col gap-1 text-[15px]">
        <li>✓ {memberCall} service calls (non-members {regularCall})</li>
        <li>✓ 15% off repairs and service work</li>
        <li>✓ Heating &amp; cooling, plumbing and electrical checked every visit</li>
      </ul>
      <Link href="/join" className="mt-5 inline-flex h-12 items-center rounded-xl bg-approve px-6 font-bold">
        Join MVP Club
      </Link>
    </section>
  )
}

export function HowWeWork() {
  return (
    <p className="text-[15px] text-body">
      <strong>How we work:</strong> a tech finds the cause, photographs it and gives you the price on your phone. Nothing is done until you approve it.
    </p>
  )
}
