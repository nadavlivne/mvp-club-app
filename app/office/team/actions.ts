'use server'

import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'

export type Access = 'none' | 'office' | 'admin'
type Result = { ok: true; tempPassword?: string } | { error: string }

// Easy to read out loud or type on a tablet: e.g. "mvp-7K3P-9QXA".
function tempPassword() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => abc[randomInt(abc.length)]).join('')
  return `mvp-${part()}-${part()}`
}

async function setRoles(id: string, name: string, isTech: boolean, van: string, access: Access) {
  const db = adminClient()
  if (isTech) {
    const { error } = await db.from('techs').upsert({ id, name, van, active: true })
    if (error) return error.message
  } else {
    await db.from('techs').update({ active: false }).eq('id', id)
  }
  if (access === 'none') {
    await db.from('staff').delete().eq('id', id)
  } else {
    const { error } = await db.from('staff').upsert({ id, name, role: access, active: true })
    if (error) return error.message
  }
  return null
}

export async function addPerson(form: FormData): Promise<Result> {
  await requireStaff('admin')
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const isTech = form.get('isTech') === 'on'
  const van = String(form.get('van') ?? '').trim()
  const access = String(form.get('access') ?? 'none') as Access
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Please enter a name and a valid email.' }
  if (!isTech && access === 'none') return { error: 'Pick at least one: tech, office or admin.' }

  const password = tempPassword()
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { must_change_password: true, name },
  })
  if (error || !data.user) return { error: /already/i.test(error?.message ?? '') ? 'Someone with this email already has a login.' : error?.message ?? 'Could not create the login.' }
  const problem = await setRoles(data.user.id, name, isTech, van, access)
  if (problem) return { error: problem }
  revalidatePath('/office/team')
  return { ok: true, tempPassword: password }
}

export async function updatePerson(form: FormData): Promise<Result> {
  const me = await requireStaff('admin')
  const id = String(form.get('id') ?? '')
  const name = String(form.get('name') ?? '').trim()
  const isTech = form.get('isTech') === 'on'
  const van = String(form.get('van') ?? '').trim()
  const access = String(form.get('access') ?? 'none') as Access
  if (!id || !name) return { error: 'Name is required.' }
  if (id === me.id && access !== 'admin') return { error: "You can't remove your own admin access." }
  const problem = await setRoles(id, name, isTech, van, access)
  if (problem) return { error: problem }
  await adminClient().auth.admin.updateUserById(id, { user_metadata: { name } })
  revalidatePath('/office/team')
  return { ok: true }
}

// Switched off: can't sign in any more (their past work stays).
export async function setActive(id: string, active: boolean): Promise<Result> {
  const me = await requireStaff('admin')
  if (id === me.id) return { error: "You can't switch off your own login." }
  const db = adminClient()
  const { error } = await db.auth.admin.updateUserById(id, { ban_duration: active ? 'none' : '876000h' })
  if (error) return { error: error.message }
  // Their roles stay as they were, so switching back on restores everything.
  revalidatePath('/office/team')
  return { ok: true }
}

export async function resetPassword(id: string): Promise<Result> {
  await requireStaff('admin')
  const password = tempPassword()
  const { error } = await adminClient().auth.admin.updateUserById(id, { password, user_metadata: { must_change_password: true } })
  if (error) return { error: error.message }
  return { ok: true, tempPassword: password }
}
