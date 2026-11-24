import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome'
import { tradeInfo } from '@/config/business'
import { servicePages } from '@/config/seo-pages'
import { site } from '@/config/site'

export const metadata: Metadata = {
  title: 'Services — Heating & Cooling, Plumbing and Electrical in Cincinnati | MVP Club',
  description: 'Furnace and AC repair, water heaters, plumbing, electrical panels and EV chargers across Greater Cincinnati.',
  alternates: { canonical: `${site.url}/services` },
}

export default function ServicesIndex() {
  const trades = servicePages.filter((s) => !s.parent)
  return (
    <div className="flex min-h-dvh flex-col bg-page text-navy">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="font-display text-[40px] leading-tight font-bold">Our services</h1>
        <p className="mt-2 max-w-2xl text-body">Heating &amp; cooling, plumbing and electrical — for members and non-members across Greater Cincinnati.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {trades.map((t) => (
            <div key={t.slug} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-line">
              <div className="h-1.5" style={{ background: tradeInfo[t.trade].color }} />
              <div className="p-5">
                <h2 className="font-display text-2xl font-bold">
                  <Link href={`/services/${t.slug}`} className="underline decoration-line underline-offset-4">
                    {t.name}
                  </Link>
                </h2>
                <p className="mt-1 text-[15px] text-body">{t.intro}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {servicePages
                    .filter((s) => s.parent === t.slug)
                    .map((s) => (
                      <li key={s.slug}>
                        <Link href={`/services/${s.slug}`} className="font-semibold text-link underline">
                          {s.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
