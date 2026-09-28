import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed, Graduate } from 'next/font/google'
import './globals.css'

const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-barlow' })
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow-condensed',
})
const graduate = Graduate({ subsets: ['latin'], weight: '400', variable: '--font-graduate' })

export const metadata: Metadata = {
  title: 'MVP Club',
  description: 'MVP Club home check-ups and estimates',
  // Customer pages are private links — keep them out of search engines.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#14223D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${graduate.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
