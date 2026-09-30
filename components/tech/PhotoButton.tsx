'use client'

import { useRef, useState } from 'react'
import { usePhotoSrc, usePhotoStore } from '@/lib/photos'

// Opens the tablet camera, shrinks the photo, and stores it (in the database's
// photo storage when signed in, or on the device in sample mode).
async function shrink(file: File, max = 1024): Promise<string> {
  const img = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.7)
}

export function Thumb({ src, className = 'size-14' }: { src?: string; className?: string }) {
  const url = usePhotoSrc(src)
  if (!src) return null
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`${className} rounded-lg object-cover`} />
  ) : (
    <div className={`${className} animate-pulse rounded-lg bg-photo`} />
  )
}

export default function PhotoButton({
  photo,
  onPhoto,
  label = 'Add photo',
  required = false,
}: {
  photo?: string
  onPhoto: (ref: string | undefined) => void
  label?: string
  required?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const store = usePhotoStore()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Thumb src={photo} />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={`h-11 rounded-[10px] border px-3 text-sm font-semibold ${
          !photo && required ? 'border-alert bg-[#FDE7E4] text-alert' : 'border-edge bg-white text-navy'
        }`}
      >
        {busy ? 'Saving photo…' : photo ? 'Retake' : required ? `${label} (required)` : label}
      </button>
      {photo && !busy && (
        <button type="button" onClick={() => onPhoto(undefined)} className="h-11 px-2 text-sm font-semibold text-link">
          Remove
        </button>
      )}
      {failed && <span className="text-sm text-alert">Photo didn&apos;t save — check the connection and try again.</span>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setBusy(true)
          setFailed(false)
          try {
            onPhoto(await store(await shrink(f)))
          } catch {
            setFailed(true)
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
