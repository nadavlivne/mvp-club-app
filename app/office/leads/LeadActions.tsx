'use client'

import { useState, useTransition } from 'react'
import { saveLeadNotes, setLeadStatus, type LeadStatus } from './actions'

export default function LeadActions({ id, status, notes }: { id: string; status: LeadStatus; notes: string }) {
  const [pending, start] = useTransition()
  const [text, setText] = useState(notes)
  const open = status === 'started' || status === 'signed_up'
  const btn = 'h-11 rounded-[10px] px-3 text-sm font-bold disabled:opacity-60'
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-2.5">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Office notes (only the office sees these)"
          className="h-11 min-h-11 flex-1 rounded-[10px] border border-edge px-3 py-2 text-sm"
        />
        {text !== notes && (
          <button type="button" disabled={pending} onClick={() => start(() => saveLeadNotes(id, text))} className={`${btn} border border-edge bg-white`}>
            Save
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {open ? (
          <>
            <button type="button" disabled={pending} onClick={() => start(() => setLeadStatus(id, 'contacted'))} className={`${btn} bg-navy text-white`}>
              Contacted
            </button>
            <button type="button" disabled={pending} onClick={() => start(() => setLeadStatus(id, 'joined'))} className={`${btn} bg-success text-white`}>
              Joined — set up in Housecall Pro ✓
            </button>
            <button type="button" disabled={pending} onClick={() => start(() => setLeadStatus(id, 'lost'))} className={`${btn} border border-edge bg-white`}>
              Not interested
            </button>
          </>
        ) : (
          <>
            {status === 'contacted' && (
              <button type="button" disabled={pending} onClick={() => start(() => setLeadStatus(id, 'joined'))} className={`${btn} bg-success text-white`}>
                Joined — set up in Housecall Pro ✓
              </button>
            )}
            <button type="button" disabled={pending} onClick={() => start(() => setLeadStatus(id, 'reopen'))} className={`${btn} border border-edge bg-white`}>
              Move back to New
            </button>
          </>
        )}
      </div>
    </div>
  )
}
