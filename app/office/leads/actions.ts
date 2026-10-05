'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'

export type LeadStatus = 'started' | 'signed_up' | 'contacted' | 'joined' | 'lost'
const OFFICE_STATUSES: LeadStatus[] = ['contacted', 'joined', 'lost']

// The office marks what happened with a lead. "Reopen" puts it back to how the customer left it.
export async function setLeadStatus(id: string, status: LeadStatus | 'reopen') {
  const staff = await requireStaff()
  const db = adminClient()
  if (status === 'reopen') {
    const { data } = await db.from('leads').select('signed_at').eq('id', id).maybeSingle<{ signed_at: string | null }>()
    await db.from('leads').update({ status: data?.signed_at ? 'signed_up' : 'started', handled_by: '', handled_at: null }).eq('id', id)
  } else if (OFFICE_STATUSES.includes(status)) {
    await db.from('leads').update({ status, handled_by: staff.name || staff.email, handled_at: new Date().toISOString() }).eq('id', id)
  }
  revalidatePath('/office/leads')
}

export async function saveLeadNotes(id: string, notes: string) {
  await requireStaff()
  await adminClient().from('leads').update({ office_notes: notes.slice(0, 2000) }).eq('id', id)
  revalidatePath('/office/leads')
}
