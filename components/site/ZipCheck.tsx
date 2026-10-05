'use client'

import { useState } from 'react'

type Area = { zip: string; city: string; state: string }

export default function ZipCheck({ areas, phone, phoneHref }: { areas: Area[]; phone: string; phoneHref: string }) {
  const [zip, setZip] = useState('')
  const clean = zip.replace(/\D/g, '').slice(0, 5)
  const hit = clean.length === 5 ? areas.find((a) => a.zip === clean) : undefined

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-line">
      <label htmlFor="zip" className="font-display text-lg font-bold">
        Do we serve your home?
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="zip"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Your zip code"
          value={clean}
          onChange={(e) => setZip(e.target.value)}
          className="h-12 w-full rounded-lg border border-edge px-3 text-lg tracking-widest outline-none focus:border-navy"
        />
      </div>
      <div className="mt-3 min-h-6 text-[15px]" aria-live="polite">
        {clean.length < 5 ? (
          <span className="text-muted">Type all 5 digits.</span>
        ) : hit ? (
          <span className="font-semibold text-success">
            ✓ Yes — we serve {hit.city}, {hit.state} {hit.zip}.
          </span>
        ) : (
          <span className="text-body">
            That zip is outside our usual area. Call{' '}
            <a className="font-semibold text-link underline" href={`tel:${phoneHref}`}>
              {phone}
            </a>{' '}
            and we&apos;ll tell you if we can still help.
          </span>
        )}
      </div>
    </div>
  )
}
