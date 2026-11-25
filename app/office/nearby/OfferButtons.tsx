'use client'

import { useState, useTransition } from 'react'
import { markOffered } from './actions'

// Edit the drafted text, copy it or open it in the phone's Messages app, then mark it offered.
export default function OfferButtons({ leadId, visitId, date, phone, text }: { leadId: string; visitId: string | null; date: string; phone: string; text: string }) {
  const [msg, setMsg] = useState(text)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()
  const digits = phone.replace(/\D/g, '').slice(-10)
  const btn = 'flex h-11 items-center justify-center rounded-[10px] border px-3 text-[15px] font-semibold'
  return (
    <div className="flex flex-col gap-2">
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="w-full rounded-lg border border-edge bg-white p-2.5 text-[15px] outline-none focus:border-navy" />
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
        <button
          type="button"
          disabled={pending || done}
          className={`${btn} border-navy bg-navy text-white disabled:opacity-60`}
          onClick={() => start(async () => setDone((await markOffered(leadId, visitId, date, msg)).ok))}
        >
          {done ? 'Marked as offered' : pending ? 'Saving…' : 'Mark as offered'}
        </button>
      </div>
    </div>
  )
}
