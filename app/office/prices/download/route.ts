import { livePriceBook, toCsv } from '@/lib/priceBook'
import { currentStaff } from '@/lib/staff'

// The current price list as a CSV file (opens in Excel or Google Sheets).
export async function GET() {
  const staff = await currentStaff()
  if (staff?.role !== 'admin') return new Response('Admins only', { status: 403 })
  const csv = toCsv([...(await livePriceBook()).values()])
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="mvp-price-list-${date}.csv"` },
  })
}
