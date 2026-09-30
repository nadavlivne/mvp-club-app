'use client'

import { useEffect, useRef, useState } from 'react'

// Finger / mouse signature box. Hands back the signature as a PNG image (or null when cleared).
export default function SignaturePad({ onChange }: { onChange: (signature: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(false)
  const ink = useRef(false) // same as hasInk, but readable right away inside the pointer handlers

  useEffect(() => {
    const canvas = canvasRef.current!
    const ratio = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * ratio
    canvas.height = canvas.clientHeight * ratio
    const ctx = canvas.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#14223D'
  }, [])

  const point = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const start = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = point(e)
  }

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return
    const p = point(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (!ink.current) {
      ink.current = true
      setHasInk(true)
    }
  }

  const end = () => {
    if (drawing.current && ink.current) onChange(canvasRef.current!.toDataURL('image/png'))
    drawing.current = false
    last.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    ink.current = false
    setHasInk(false)
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-[120px] rounded-[10px] border border-dashed border-[#8A96A8] bg-[#FAFBFC]">
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            Sign here with your finger
          </div>
        )}
        <canvas
          ref={canvasRef}
          aria-label="Signature box"
          className="absolute inset-0 size-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        />
      </div>
      {hasInk && (
        <button type="button" onClick={clear} className="h-11 self-end px-2 text-sm font-semibold text-link">
          Clear signature
        </button>
      )}
    </div>
  )
}
