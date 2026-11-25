'use client'

import { useState, useTransition } from 'react'
import { markReminder, undoReminder } from './actions'

type Items = { key: string; stage: number }[]

export default function ReminderButtons({ linkId, items, phone, text, done }: { linkId: string; items: Items; phone: string; text: string; done: boolean }) {
  const [msg, setMsg] = useState(text)
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()
  const digits = phone.replace(/\D/g, '').slice(-10)
  const btn = 'flex h-11 items-center justify-center rounded-[10px] border px-3 text-[15px] font-semibold disabled:opacity-60'

  if (done) {
    return (
      <button type="button" disabled={pending} className={`${btn} self-start border-edge bg-white text-navy`} onClick={() => start(() => undoReminder(linkId, items))}>
        Move back to due
      </button>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} className="w-full rounded-lg border border-edge bg-white p-2.5 text-[15px] outline-none focus:border-navy" />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btn} border-edge bg-white text-navy`}
          onClick={async () => {
            await navigator.clipboard.writeText(msg)
            setCopied(true)
          }}
        >
          {copied ? 'Copied' : 'Copy text'}
        </button>
        {digits.length === 10 && (
          <a href={`sms:+1${digits}?&body=${encodeURIComponent(msg)}`} className={`${btn} border-edge bg-white text-navy`}>
            Open in Messages
          </a>
        )}
        <button type="button" disabled={pending} className={`${btn} border-navy bg-navy text-white`} onClick={() => start(async () => void (await markReminder(linkId, items, 'sent', msg)))}>
          Mark as sent
        </button>
        <button type="button" disabled={pending} className={`${btn} border-edge bg-white text-muted`} onClick={() => start(async () => void (await markReminder(linkId, items, 'skipped', '')))}>
          Skip
        </button>
      </div>
    </div>
  )
}
