'use client'

import { useState } from 'react'

// The tech's photo on a customer page. Nothing is shown when there is no photo.
// Tapping it opens it full screen.
export default function Photo({ label, src }: { label: string; src?: string }) {
  const [open, setOpen] = useState(false)
  if (!src) return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`${label} — tap to enlarge`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="size-[72px] rounded-lg object-cover" />
      </button>
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="max-h-full max-w-full rounded-lg" />
          <span className="absolute top-4 right-4 flex h-11 items-center rounded-[10px] bg-white px-4 text-[15px] font-bold text-navy">Close</span>
        </button>
      )}
    </>
  )
}
