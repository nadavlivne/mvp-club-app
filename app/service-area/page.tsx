import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome'
import ZipCheck from '@/components/site/ZipCheck'
import { site } from '@/config/site'
import { loadServiceArea } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Service area — Cincinnati, Northern Kentucky & SE Indiana | MVP Club',
  description: `MVP Club serves homes within ${site.serviceRadiusMiles} miles of downtown Cincinnati: ${site.areaSummary}`,
  alternates: { canonical: `${site.url}/service-area` },
  robots: { index: true, follow: true },
}

const STATES: [string, string][] = [
  ['OH', 'Ohio'],
  ['KY', 'Northern Kentucky'],
  ['IN', 'Southeast Indiana'],
]

export default function ServiceAreaPage() {
  const areas = loadServiceArea(site.serviceRadiusMiles)
  const towns = (state: string) => [...new Set(areas.filter((a) => a.state === state).map((a) => a.city))].sort()
  return (
    <div className="flex min-h-dvh flex-col bg-page text-navy">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="font-display text-[40px] leading-tight font-bold">Where we work</h1>
        <p className="mt-2 max-w-2xl text-body">
          We serve homes within about {site.serviceRadiusMiles} miles of our office in downtown Cincinnati. {site.areaSummary}
        </p>
        <div className="mt-6 max-w-md">
          <ZipCheck areas={areas} phone={site.phoneDisplay} phoneHref={site.phoneHref} />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STATES.map(([code, name]) => (
            <section key={code} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-line">
              <h2 className="font-display text-2xl font-bold">{name}</h2>
              <ul className="mt-3 columns-2 gap-4 text-[15px] leading-7 text-body">
                {towns(code).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start gap-3 rounded-xl bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg">Don&apos;t see your town? Call or text {site.phoneDisplay} — we may still be able to help.</p>
          <Link href="/join" className="flex h-12 shrink-0 items-center rounded-xl bg-approve px-6 font-bold">
            Join MVP Club
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
