'use client'

// Last-resort screen if something unexpected fails in the tech app.
export default function TechError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-10">
      <h1 className="font-display text-[26px] font-bold">Something went wrong</h1>
      <p className="text-[15px] text-body">Please try again. If it keeps happening, send a screenshot of this page to the office.</p>
      {error.digest && <p className="font-mono text-xs text-muted">Code: {error.digest}</p>}
      <button type="button" onClick={reset} className="h-11 self-start rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white">
        Try again
      </button>
    </main>
  )
}
