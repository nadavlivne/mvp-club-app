'use client'

import { useState } from 'react'
import type { VisitWork } from '@/lib/tech'
import { Card } from '../ui'

export type SendState = {
  onSend: () => void
  busy: boolean // sending, or the last change is still being saved
  error: string | null
  db: boolean // false = sample mode, nothing is really sent
}

// The send button plus what happened after: the customer's private link.
export default function SendControls({ label, blocked, send, work }: { label: string; blocked: boolean; send: SendState; work: VisitWork }) {
  const [copied, setCopied] = useState(false)
  const url = work.linkPath && typeof window !== 'undefined' ? `${window.location.origin}${work.linkPath}` : ''
  const off = blocked || send.busy
  return (
    <>
      <button
        type="button"
        disabled={off}
        onClick={send.onSend}
        className={`h-[52px] rounded-xl text-[17px] font-bold ${off ? 'bg-line text-muted' : 'bg-approve text-white'}`}
      >
        {send.busy ? 'Saving…' : work.sentAt ? 'Send a new link' : label}
      </button>
      {send.error && <Card className="col-span-full border-2 border-alert text-sm text-alert">{send.error}</Card>}
      {work.sentAt && (
        <Card className="col-span-full flex flex-col gap-2 text-sm text-body">
          <div>
            Sent at {new Date(work.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.
            {!send.db && ' (Sample mode — nothing was really sent.)'}
          </div>
          {url && (
            <>
              <div className="font-semibold text-navy">Customer&apos;s private link:</div>
              <div className="rounded-[10px] bg-page px-3 py-2 font-mono text-[13px] break-all">{url}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(url)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    } catch {}
                  }}
                  className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white"
                >
                  {copied ? '✓ Copied' : 'Copy link'}
                </button>
                <a href={url} target="_blank" rel="noreferrer" className="flex h-11 items-center rounded-[10px] border border-navy px-4 text-[15px] font-bold text-navy">
                  Open customer page
                </a>
              </div>
              <div className="text-xs text-muted">
                Texting the link automatically through Housecall Pro comes in phase 3. For now, paste it into a text to the customer — or hand them the
                tablet on the customer page.
              </div>
            </>
          )}
        </Card>
      )}
    </>
  )
}
