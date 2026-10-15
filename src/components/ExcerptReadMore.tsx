'use client'

import { useState } from 'react'

// Shows ~`words` words of the post excerpt with a "Læs mere" toggle to reveal
// the rest. Keeps the hero compact while the full intro stays one click away.
export function ExcerptReadMore({ text, words = 100 }: { text?: string | null; words?: number }) {
  const [open, setOpen] = useState(false)
  const clean = (text || '').trim()
  if (!clean) return null

  const parts = clean.split(/\s+/)
  const isLong = parts.length > words
  const shown = !isLong || open ? clean : parts.slice(0, words).join(' ') + '…'

  return (
    <div style={{ maxWidth: '640px' }}>
      <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
        {shown}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            marginTop: '10px', background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', color: 'var(--green)', fontSize: '14px', fontWeight: 700,
            fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}
        >
          {open ? 'Vis mindre' : 'Læs mere'} <span aria-hidden>{open ? '▴' : '▾'}</span>
        </button>
      )}
    </div>
  )
}
