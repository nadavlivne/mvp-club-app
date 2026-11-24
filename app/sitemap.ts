import type { MetadataRoute } from 'next'
import { areaPages, servicePages } from '@/config/seo-pages'
import { site } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: 'monthly', priority: 1 },
    { url: `${site.url}/join`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${site.url}/service-area`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/services`, changeFrequency: 'monthly', priority: 0.8 },
    ...servicePages.map((s) => ({ url: `${site.url}/services/${s.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...areaPages.map((a) => ({ url: `${site.url}/areas/${a.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ]
}
