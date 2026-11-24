import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HowWeWork, MemberPitch, PageHero } from '@/components/site/LocalPage'
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome'
import ZipCheck from '@/components/site/ZipCheck'
import { tradeInfo } from '@/config/business'
import { areaPages, findArea, nearbyAreas, servicePages } from '@/config/seo-pages'
import { site } from '@/config/site'
import { loadServiceArea } from '@/lib/data'
import { serviceCallPrices } from '@/lib/serviceCall'

export function generateStaticParams() {
  return areaPages.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = findArea((await params).slug)
  if (!a) return {}
  return {
    title: `Heating & Cooling, Plumbing and Electrical in ${a.name}, OH | MVP Club`,
    description: `Furnace and AC repair, plumbing and electrical service in ${a.name}, OH — plus MVP Club home check-ups covering all three trades.`,
    alternates: { canonical: `${site.url}/areas/${a.slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = findArea((await params).slug)
  if (!a) notFound()
  const { memberCall, regularCall } = await serviceCallPrices()
  const nearby = nearbyAreas(a)
  const trades = servicePages.filter((s) => !s.parent)
  const areas = loadServiceArea(site.serviceRadiusMiles)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['HVACBusiness', 'Plumber', 'Electrician'],
    name: site.name,
    url: `${site.url}/areas/${a.slug}`,
    telephone: `+1-${site.phone}`,
    areaServed: { '@type': 'City', name: `${a.name}, OH` },
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page text-navy">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          eyebrow={(a.kind ?? `${a.name}, Ohio`).toUpperCase()}
          title={`Heating & cooling, plumbing and electrical in ${a.name}`}
          intro={`One team for your ${a.name} home: furnace and AC repair, plumbing and electrical work — and MVP Club check-ups that cover all three, twice a year.`}
          memberCall={memberCall}
          regularCall={regularCall}
        />
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
          <section>
            <h2 className="font-display text-[28px] leading-tight font-bold">What we do in {a.name}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {trades.map((t) => {
                const subs = servicePages.filter((s) => s.parent === t.slug)
                return (
                  <div key={t.slug} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-line">
                    <div className="h-1.5" style={{ background: tradeInfo[t.trade].color }} />
                    <div className="p-5">
                      <h3 className="font-display text-xl font-bold">
                        <Link href={`/services/${t.slug}`} className="underline decoration-line underline-offset-4">
                          {t.name}
                        </Link>
                      </h3>
                      <ul className="mt-2 flex flex-col gap-1.5 text-[15px] text-body">
                        {t.jobs.slice(0, 4).map((j) => (
                          <li key={j}>· {j}</li>
                        ))}
                      </ul>
                      {subs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                          {subs.map((s) => (
                            <Link key={s.slug} href={`/services/${s.slug}`} className="font-semibold text-link underline">
                              {s.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
          <HowWeWork />
          <MemberPitch
            memberCall={memberCall}
            regularCall={regularCall}
            text={`Members in ${a.name} get a spring AC check-up and a fall furnace check-up, and every visit also covers plumbing and electrical — with a file on the house that grows every visit.`}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="font-display text-2xl font-bold">Zip codes we serve here</h2>
              <p className="mt-2 text-body">{a.zips.join(' · ')}</p>
              <div className="mt-4">
                <ZipCheck areas={areas} phone={site.phoneDisplay} phoneHref={site.phoneHref} />
              </div>
            </section>
            {nearby.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold">Nearby</h2>
                <ul className="mt-2 columns-2 gap-4 text-[15px] leading-8">
                  {nearby.map((n) => (
                    <li key={n.slug}>
                      <Link href={`/areas/${n.slug}`} className="text-link underline">
                        {n.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/service-area" className="mt-2 inline-block text-sm font-semibold text-link underline">
                  See every town we serve
                </Link>
              </section>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
