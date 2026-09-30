import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'
import TeamManager, { type Person } from './TeamManager'

export const metadata = { title: 'Team · MVP Club office' }

// Admin only: everyone with a login — techs, office and admins.
export default async function TeamPage() {
  const me = await requireStaff('admin')
  const db = adminClient()
  const [{ data: users }, { data: techs }, { data: staff }] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 500 }),
    db.from('techs').select('id, name, van, active'),
    db.from('staff').select('id, name, role, active'),
  ])
  const techOf = new Map((techs ?? []).map((t) => [t.id as string, t]))
  const staffOf = new Map((staff ?? []).map((s) => [s.id as string, s]))
  const people: Person[] = (users?.users ?? []).map((u) => {
    const t = techOf.get(u.id)
    const s = staffOf.get(u.id)
    const bannedUntil = (u as { banned_until?: string | null }).banned_until
    return {
      id: u.id,
      email: u.email ?? '',
      name: (s?.name as string) || (t?.name as string) || (u.user_metadata?.name as string) || '',
      isTech: !!t?.active,
      van: (t?.van as string) ?? '',
      access: (s?.role as Person['access']) ?? 'none',
      active: !bannedUntil || new Date(bannedUntil) < new Date(),
      lastSignIn: u.last_sign_in_at ?? null,
      mustChangePassword: u.user_metadata?.must_change_password === true,
      isMe: u.id === me.id,
    }
  })
  people.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
  const vans = [...new Set(people.map((p) => p.van).filter(Boolean))].sort()
  return <TeamManager people={people} vans={vans} />
}
