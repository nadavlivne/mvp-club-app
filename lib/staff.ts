import 'server-only'
import { redirect } from 'next/navigation'
import { userClient } from './supabase/server'

export type StaffRole = 'admin' | 'office'
export type Staff = { id: string; name: string; role: StaffRole; email: string }

// The signed-in person's office role, or null if they are not office staff.
export async function currentStaff(): Promise<Staff | null> {
  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('name, role, active').eq('id', user.id).maybeSingle<{ name: string; role: StaffRole; active: boolean }>()
  if (!data || !data.active) return null
  return { id: user.id, name: data.name, role: data.role, email: user.email ?? '' }
}

// For office pages and actions: signed-in staff only (optionally admin only).
export async function requireStaff(role?: 'admin'): Promise<Staff> {
  const staff = await currentStaff()
  if (!staff) redirect('/tech/login')
  if (role === 'admin' && staff.role !== 'admin') redirect('/office')
  return staff
}

// Monday of this week (Mon–Sun, Cincinnati time) as YYYY-MM-DD; bonus is paid the Friday after.
export function weekStartET(now = new Date()) {
  const today = new Date(now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) + 'T12:00:00')
  const back = (today.getDay() + 6) % 7
  today.setDate(today.getDate() - back)
  return today.toISOString().slice(0, 10)
}
export const dateET = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
