'use client'

import { useEffect, useRef } from 'react'

// Cloudflare Turnstile: a quiet "are you human" check (usually no clicking needed).
// Shows nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set in Vercel.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export const turnstileEnabled = Boolean(SITE_KEY)

export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const cb = useRef(onToken)
  cb.current = onToken

  useEffect(() => {
    if (!SITE_KEY || !box.current) return
    let id: string | undefined
    let stopped = false
    const draw = () => {
      if (stopped || !box.current || !window.turnstile) return
      id = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        size: 'flexible',
        callback: (t: string) => cb.current(t),
        'expired-callback': () => cb.current(''),
        'error-callback': () => cb.current(''),
      })
    }
    if (window.turnstile) draw()
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`)
      if (!s) {
        s = document.createElement('script')
        s.src = SCRIPT
        s.async = true
        document.head.appendChild(s)
      }
      s.addEventListener('load', draw)
    }
    return () => {
      stopped = true
      if (id && window.turnstile) window.turnstile.remove(id)
    }
  }, [])

  if (!SITE_KEY) return null
  return <div ref={box} className="min-h-[65px]" />
}
