'use client'

import { useTransition } from 'react'
import { setScheduled } from './actions'

export default function ScheduledButton({ id, scheduled }: { id: string; scheduled: boolean }) {
  const [pending, start] = useTransition()
  return scheduled ? (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setScheduled(id, false))}
      className="h-11 rounded-[10px] border border-edge bg-white px-3 text-sm font-semibold text-navy"
    >
      {pending ? '…' : 'Undo'}
    </button>
  ) : (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setScheduled(id, true))}
      className="h-11 rounded-[10px] bg-success px-4 text-[15px] font-bold text-white"
    >
      {pending ? 'Saving…' : 'Scheduled in Housecall Pro ✓'}
    </button>
  )
}
