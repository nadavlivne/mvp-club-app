'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { browserClient } from './supabase/browser'
import { newWork, type Visit, type VisitWork } from './tech'

export type SaveStatus = 'saved' | 'saving' | 'error' | 'device'

// Where the tech's work is kept:
// - with Supabase (keys set): in the database, saved a moment after each change
// - without (sample mode): in this device's browser storage
const key = (id: string) => `mvp-visit-${id}`

export function readWork(v: Visit): VisitWork {
  try {
    const raw = localStorage.getItem(key(v.id))
    if (raw) return { ...newWork(v), ...JSON.parse(raw) }
  } catch {}
  return newWork(v)
}

export function useVisitWork(v: Visit, db = false, initial: VisitWork | null = null) {
  const [work, setWork] = useState<VisitWork>(() => (db ? { ...newWork(v), ...(initial ?? {}) } : newWork(v)))
  const [loaded, setLoaded] = useState(!!db)
  const [status, setStatus] = useState<SaveStatus>(db ? 'saved' : 'device')
  const first = useRef(true)

  // Sample mode: load from the device once.
  useEffect(() => {
    if (db) return
    setWork(readWork(v))
    setLoaded(true)
  }, [v, db])

  useEffect(() => {
    if (!loaded) return
    if (first.current) {
      first.current = false
      return
    }
    if (!db) {
      try {
        localStorage.setItem(key(v.id), JSON.stringify(work))
        setStatus('device')
      } catch {
        setStatus('error') // usually: too many photos for the device storage
      }
      return
    }
    setStatus('saving')
    const t = setTimeout(async () => {
      const supabase = browserClient()
      const { data } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('visit_work')
        .upsert({ visit_id: v.id, work, updated_at: new Date().toISOString(), updated_by: data.user?.id })
      setStatus(error ? 'error' : 'saved')
    }, 700)
    return () => clearTimeout(t)
  }, [work, loaded, v.id, db])

  const update = useCallback((fn: (w: VisitWork) => VisitWork) => setWork((w) => fn(w)), [])
  const reset = useCallback(() => setWork(newWork(v)), [v])
  return { work, update, reset, loaded, status, saveError: status === 'error' }
}
