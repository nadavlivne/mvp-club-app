import type { MetadataRoute } from 'next'
import { site } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: 'monthly', priority: 1 },
    { url: `${site.url}/join`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${site.url}/service-area`, changeFrequency: 'monthly', priority: 0.7 },
  ]
}
