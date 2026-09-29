'use client'

import { useCallback, useEffect, useState } from 'react'
import { newWork, type Visit, type VisitWork } from './tech'

// Phase 2 step 1: the tech's work is kept on this device (browser storage) so a
// refresh doesn't lose it. The database replaces this in the next step.
const key = (id: string) => `mvp-visit-${id}`

export function readWork(v: Visit): VisitWork {
  try {
    const raw = localStorage.getItem(key(v.id))
    if (raw) return { ...newWork(v), ...JSON.parse(raw) }
  } catch {}
  return newWork(v)
}

export function useVisitWork(v: Visit) {
  const [work, setWork] = useState<VisitWork>(() => newWork(v))
  const [loaded, setLoaded] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    setWork(readWork(v))
    setLoaded(true)
  }, [v])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(key(v.id), JSON.stringify(work))
      setSaveError(false)
    } catch {
      setSaveError(true) // usually: too many photos for the device storage
    }
  }, [work, loaded, v.id])

  const update = useCallback((fn: (w: VisitWork) => VisitWork) => setWork((w) => fn(w)), [])
  const reset = useCallback(() => setWork(newWork(v)), [v])
  return { work, update, reset, loaded, saveError }
}
