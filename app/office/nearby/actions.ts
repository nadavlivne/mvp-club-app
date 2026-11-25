'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'

// Logs that the office texted a member about a nearby slot, so nobody texts them again.
export async function markOffered(leadId: string, visitId: string | null, date: string, message: string) {
  const staff = await requireStaff()
  if (!/^[0-9a-f-]{36}$/.test(leadId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false }
  const { error } = await adminClient()
    .from('nearby_offers')
    .insert({
      member_lead_id: leadId,
      visit_id: visitId && /^[0-9a-f-]{36}$/.test(visitId) ? visitId : null,
      offer_date: date,
      message: message.slice(0, 1000),
      offered_by: staff.name || staff.email,
    })
  revalidatePath('/office/nearby')
  return { ok: !error }
}
