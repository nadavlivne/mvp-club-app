'use client'

import { useActionState } from 'react'
import { Card } from '@/components/ui'
import { setOwnPassword } from '../actions'

const field = 'h-12 rounded-[10px] border border-edge bg-white px-3 text-base text-navy'

export default function SetPasswordForm() {
  const [state, action, pending] = useActionState(setOwnPassword, undefined)
  return (
    <Card>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          New password
          <input name="password" type="password" autoComplete="new-password" minLength={8} required className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Type it again
          <input name="again" type="password" autoComplete="new-password" minLength={8} required className={field} />
        </label>
        {state?.error && <div className="text-sm font-semibold text-alert">{state.error}</div>}
        <button type="submit" disabled={pending} className="h-[52px] rounded-xl bg-navy text-[17px] font-bold text-white">
          {pending ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </Card>
  )
}
