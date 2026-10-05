import { liveGuide } from '@/lib/guideBook'
import { livePriceBook, toCsv, toXlsx } from '@/lib/priceBook'
import { currentStaff } from '@/lib/staff'

// The current price list and check-up list: Excel with one tab each per trade (+ How to), or a prices-only CSV.
export async function GET(request: Request) {
  const staff = await currentStaff()
  if (staff?.role !== 'admin') return new Response('Admins only', { status: 403 })
  const rows = [...(await livePriceBook()).values()]
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  if (new URL(request.url).searchParams.get('format') === 'csv') {
    return new Response(toCsv(rows), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="mvp-price-list-${date}.csv"` },
    })
  }
  return new Response(new Uint8Array(await toXlsx(rows, [...(await liveGuide()).values()])), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="mvp-price-list-${date}.xlsx"`,
    },
  })
}
