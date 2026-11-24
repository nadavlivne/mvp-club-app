// Service call prices for the public pages, read from the price book.
import 'server-only'
import { serviceCallCode } from '@/config/business'
import { loadCatalogLive } from '@/lib/data'
import { money } from '@/lib/pricing'

export async function serviceCallPrices() {
  const { book } = await loadCatalogLive()
  const call = book.get(serviceCallCode.HVAC)
  return { memberCall: money(call?.memberPrice ?? 19), regularCall: money(call?.standardPrice ?? 119) }
}
