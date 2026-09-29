'use client'

import { useRef } from 'react'

// Opens the tablet camera, shrinks the photo so it can be kept on the device,
// and hands it back as an image string. Photo storage moves to Supabase later.
async function shrink(file: File, max = 1024): Promise<string> {
  const img = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.7)
}

export default function PhotoButton({
  photo,
  onPhoto,
  label = 'Add photo',
  required = false,
}: {
  photo?: string
  onPhoto: (dataUrl: string | undefined) => void
  label?: string
  required?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-2">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="size-14 rounded-lg object-cover" />
      ) : null}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`h-11 rounded-[10px] border px-3 text-sm font-semibold ${
          !photo && required ? 'border-alert bg-[#FDE7E4] text-alert' : 'border-edge bg-white text-navy'
        }`}
      >
        {photo ? 'Retake' : required ? `${label} (required)` : label}
      </button>
      {photo && (
        <button type="button" onClick={() => onPhoto(undefined)} className="h-11 px-2 text-sm font-semibold text-link">
          Remove
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) onPhoto(await shrink(f))
          e.target.value = ''
        }}
      />
    </div>
  )
}
