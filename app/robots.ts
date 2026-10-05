import type { MetadataRoute } from 'next'
import { site } from '@/config/site'

// Only the public home page is for search engines; staff and customer pages stay private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/tech', '/office', '/r/', '/demo', '/report', '/estimate'] },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
