'use client'

import { useTransition } from 'react'
import { setPaid } from './actions'

export default function PaidButton({ id, paid }: { id: string; paid: boolean }) {
  const [pending, start] = useTransition()
  return paid ? (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setPaid(id, false))}
      className="h-11 rounded-[10px] border border-edge bg-white px-3 text-sm font-semibold text-navy"
    >
      {pending ? '…' : 'Undo paid'}
    </button>
  ) : (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setPaid(id, true))}
      className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white"
    >
      {pending ? 'Saving…' : 'Mark as paid'}
    </button>
  )
}
