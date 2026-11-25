'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'

// Admin types a van's paid revenue for the week (from Housecall Pro) until phase 3 does it automatically.
export async function saveVanRevenue(form: FormData): Promise<void> {
  const staff = await requireStaff('admin')
  const week = String(form.get('week') ?? '')
  const van = String(form.get('van') ?? '').slice(0, 60)
  const raw = String(form.get('revenue') ?? '').replace(/[$,\s]/g, '')
  const revenue = Number(raw)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !van || raw === '' || !Number.isFinite(revenue) || revenue < 0 || revenue > 1_000_000) return
  await adminClient()
    .from('van_week_revenue')
    .upsert({
      week_start: week,
      van,
      revenue: Math.round(revenue * 100) / 100,
      note: String(form.get('note') ?? '').slice(0, 300),
      entered_by: staff.name || staff.email,
      updated_at: new Date().toISOString(),
    })
  revalidatePath('/office/bonuses')
}
