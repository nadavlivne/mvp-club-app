import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MVP Club',
    short_name: 'MVP Club',
    start_url: '/tech',
    display: 'standalone',
    background_color: '#F4F5F7',
    theme_color: '#14223D',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
