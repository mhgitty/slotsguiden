'use client'
import { useState } from 'react'

// Folds long card text behind "Læs mere". The full text is always in the HTML
// (good for search engines); only its visible height changes.
export function CardFold({ children, fold }: { children: React.ReactNode; fold: boolean }) {
  const [open, setOpen] = useState(false)
  if (!fold) return <div className="kc-text">{children}</div>
  return (
    <div className={`kc-text${open ? ' is-open' : ''}`}>
      <div className="kc-clamp">{children}</div>
      <button type="button" className="kc-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{open ? 'Vis mindre' : 'Læs mere'}</span>
        <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  )
}
