'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { PHOTO_REF } from './photoRef'
import { browserClient } from './supabase/browser'

// A photo is either an image string kept in the work itself (sample mode) or a
// reference to a file in the private "photos" storage: "sb:<visit id>/<file>.jpg".
export { PHOTO_REF }
export const isPhotoRef = (s?: string) => !!s && s.startsWith(PHOTO_REF)

// How the tech app stores a new photo. Sample mode keeps the image string.
export type PhotoStore = (dataUrl: string) => Promise<string>
export const PhotoStoreContext = createContext<PhotoStore>(async (d) => d)
export const usePhotoStore = () => useContext(PhotoStoreContext)

export function storageUploader(visitId: string): PhotoStore {
  return async (dataUrl) => {
    const blob = await (await fetch(dataUrl)).blob()
    const path = `${visitId}/${crypto.randomUUID()}.jpg`
    const { error } = await browserClient().storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' })
    if (error) throw new Error(error.message)
    return PHOTO_REF + path
  }
}

// Turns a stored reference into a short-lived link the signed-in tech can view.
const cache = new Map<string, string>()
export function usePhotoSrc(src?: string) {
  const [url, setUrl] = useState(() => (src && !isPhotoRef(src) ? src : src ? cache.get(src) : undefined))
  useEffect(() => {
    if (!src || !isPhotoRef(src)) {
      setUrl(src)
      return
    }
    if (cache.has(src)) {
      setUrl(cache.get(src))
      return
    }
    let live = true
    browserClient()
      .storage.from('photos')
      .createSignedUrl(src.slice(PHOTO_REF.length), 60 * 60)
      .then(({ data }: { data: { signedUrl: string } | null }) => {
        if (data?.signedUrl) cache.set(src, data.signedUrl)
        if (live) setUrl(data?.signedUrl)
      })
    return () => {
      live = false
    }
  }, [src])
  return url
}
