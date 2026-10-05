'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui'
import { addPerson, resetPassword, setActive, updatePerson, type Access } from './actions'

export type Person = {
  id: string
  email: string
  name: string
  isTech: boolean
  van: string
  access: Access
  active: boolean
  lastSignIn: string | null
  mustChangePassword: boolean
  isMe: boolean
}

const field = 'h-11 rounded-[10px] border border-edge bg-white px-3 text-[15px] text-navy'
const accessLabel: Record<Access, string> = { none: 'No office access', office: 'Office (no revenue or bonuses)', admin: 'Admin (everything)' }

function RoleFields({ p, vans }: { p?: Partial<Person>; vans: string[] }) {
  const [isTech, setIsTech] = useState(p?.isTech ?? true)
  return (
    <>
      <label className="flex h-11 items-center gap-2 text-[15px] font-semibold">
        <input type="checkbox" name="isTech" checked={isTech} onChange={(e) => setIsTech(e.target.checked)} className="size-5" />
        Tech (uses the tablet)
      </label>
      {isTech && (
        <label className="flex flex-col gap-1 text-xs text-muted">
          Van
          <input name="van" defaultValue={p?.van ?? ''} list="vans" placeholder="Van 1" className={field} />
          <datalist id="vans">
            {vans.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </label>
      )}
      <label className="flex flex-col gap-1 text-xs text-muted">
        Office access
        <select name="access" defaultValue={p?.access ?? 'none'} className={field}>
          {(['none', 'office', 'admin'] as Access[]).map((a) => (
            <option key={a} value={a}>
              {accessLabel[a]}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

// Shown once: the admin passes it to the person, who picks their own on first sign-in.
function TempPassword({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  return (
    <Card className="flex flex-col gap-2 border-2 border-success">
      <div className="text-base font-bold text-success">Login ready — give these to them</div>
      <div className="text-[15px]">
        Email: <b>{email}</b>
      </div>
      <div className="text-[15px]">
        Temporary password: <b className="rounded bg-page px-2 py-1 font-mono text-lg">{password}</b>
      </div>
      <div className="text-sm text-muted">
        They sign in at your app address and choose their own password right away. This password is shown only once.
      </div>
      <button type="button" onClick={onClose} className="h-11 self-start rounded-[10px] border border-edge px-4 text-[15px] font-semibold">
        Done
      </button>
    </Card>
  )
}

export default function TeamManager({ people, vans }: { people: Person[]; vans: string[] }) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [shown, setShown] = useState<{ email: string; password: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<{ ok: true; tempPassword?: string } | { error: string }>, email = '', after?: () => void) =>
    start(async () => {
      setError(null)
      const r = await fn()
      if ('error' in r) return setError(r.error)
      if (r.tempPassword) setShown({ email, password: r.tempPassword })
      after?.()
    })

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-3.5 px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[28px] font-bold">Team</h1>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white">
            + Add person
          </button>
        )}
      </div>

      {shown && <TempPassword {...shown} onClose={() => setShown(null)} />}
      {error && <Card className="border-2 border-alert text-sm font-semibold text-alert">{error}</Card>}

      {adding && (
        <Card>
          <form
            action={(form) => run(() => addPerson(form), String(form.get('email') ?? ''), () => setAdding(false))}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="flex flex-col gap-1 text-xs text-muted">
              Name
              <input name="name" required className={field} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Email (their login)
              <input name="email" type="email" required className={field} />
            </label>
            <RoleFields vans={vans} />
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={pending} className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white">
                {pending ? 'Creating…' : 'Create login'}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="h-11 px-3 text-[15px] font-semibold text-link">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {people.map((p) =>
          editing === p.id ? (
            <Card key={p.id}>
              <form action={(form) => run(() => updatePerson(form), '', () => setEditing(null))} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={p.id} />
                <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
                  Name
                  <input name="name" defaultValue={p.name} required className={field} />
                </label>
                <RoleFields p={p} vans={vans} />
                <div className="flex gap-2 sm:col-span-2">
                  <button type="submit" disabled={pending} className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="h-11 px-3 text-[15px] font-semibold text-link">
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          ) : (
            <Card key={p.id} className={`flex flex-col gap-2 ${p.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-lg font-bold">
                    {p.name || '(no name)'} {p.isMe && <span className="text-sm font-normal text-muted">· you</span>}
                  </span>
                  <span className="text-sm text-body">{p.email}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.active ? 'bg-success-bg text-success' : 'bg-page text-muted'}`}>
                  {p.active ? 'Active' : 'Switched off'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-muted">
                {p.isTech && <span className="rounded-full bg-page px-2 py-0.5">Tech{p.van ? ` · ${p.van}` : ''}</span>}
                {p.access !== 'none' && <span className="rounded-full bg-page px-2 py-0.5">{p.access === 'admin' ? 'Admin' : 'Office'}</span>}
                <span className="rounded-full bg-page px-2 py-0.5 font-normal">
                  {p.mustChangePassword
                    ? 'Has not chosen a password yet'
                    : p.lastSignIn
                      ? `Last sign-in ${new Date(p.lastSignIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'Never signed in'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-line pt-2">
                <button type="button" onClick={() => setEditing(p.id)} className="h-11 rounded-[10px] border border-edge px-3 text-sm font-semibold">
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => confirm(`Give ${p.name || p.email} a new temporary password?`) && run(() => resetPassword(p.id), p.email)}
                  className="h-11 rounded-[10px] border border-edge px-3 text-sm font-semibold"
                >
                  New password
                </button>
                {!p.isMe && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      (p.active ? confirm(`Switch off ${p.name || p.email}? They won't be able to sign in. Their past work stays.`) : true) &&
                      run(() => setActive(p.id, !p.active))
                    }
                    className="h-11 px-3 text-sm font-semibold text-link"
                  >
                    {p.active ? 'Switch off' : 'Switch back on'}
                  </button>
                )}
              </div>
            </Card>
          ),
        )}
      </div>
    </main>
  )
}
