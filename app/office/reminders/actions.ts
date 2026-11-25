'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'

// The office sent (or chose to skip) a reminder: it leaves the "Due" list.
export async function markReminder(linkId: string, items: { key: string; stage: number }[], outcome: 'sent' | 'skipped', message: string) {
  const staff = await requireStaff()
  if (!/^[0-9a-f-]{36}$/.test(linkId) || !items.length || !['sent', 'skipped'].includes(outcome)) return { ok: false }
  const rows = items.slice(0, 50).map((i) => ({
    link_id: linkId,
    item_key: String(i.key).slice(0, 80),
    stage: Number(i.stage) || 0,
    outcome,
    message: message.slice(0, 1000),
    done_by: staff.name || staff.email,
  }))
  const { error } = await adminClient().from('report_reminders').upsert(rows, { onConflict: 'link_id,item_key,stage' })
  revalidatePath('/office/reminders')
  return { ok: !error }
}

export async function undoReminder(linkId: string, items: { key: string; stage: number }[]) {
  await requireStaff()
  if (!/^[0-9a-f-]{36}$/.test(linkId)) return
  for (const i of items.slice(0, 50)) {
    await adminClient().from('report_reminders').delete().eq('link_id', linkId).eq('item_key', String(i.key)).eq('stage', Number(i.stage) || 0)
  }
  revalidatePath('/office/reminders')
}
