'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'

// The office booked this job in Housecall Pro (automatic in phase 3).
export async function setScheduled(approvalId: string, scheduled: boolean) {
  const staff = await requireStaff()
  await adminClient()
    .from('approvals')
    .update(scheduled ? { scheduled_at: new Date().toISOString(), scheduled_by: staff.id } : { scheduled_at: null, scheduled_by: null })
    .eq('id', approvalId)
  revalidatePath('/office')
}
