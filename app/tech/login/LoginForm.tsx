'use client'

import { useActionState } from 'react'
import { signIn } from '../actions'
import { Card } from '@/components/ui'

const field = 'h-12 rounded-[10px] border border-edge bg-white px-3 text-base text-navy'

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined)
  return (
    <Card>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Email
          <input name="email" type="email" autoComplete="username" required defaultValue={state?.email} key={state?.email} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Password
          <input name="password" type="password" autoComplete="current-password" required className={field} />
        </label>
        {state?.error && <div className="text-sm font-semibold text-alert">{state.error}</div>}
        <button type="submit" disabled={pending} className="h-[52px] rounded-xl bg-navy text-[17px] font-bold text-white">
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Card>
  )
}
