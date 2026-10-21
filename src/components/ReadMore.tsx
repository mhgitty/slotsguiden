'use client'
import { useState, type ReactNode } from 'react'

/**
 * Shows `short` with a "Læs mere" button; the button swaps in `full`.
 * inline: the button sits at the end of the text (for intros inside a <p>).
 */
export function ReadMore({ short, full, inline = true }: { short: ReactNode; full: ReactNode; inline?: boolean }) {
  const [open, setOpen] = useState(false)
  const btn = (
    <button type="button" className={`rm-btn${inline ? '' : ' rm-block'}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
      {open ? 'Vis mindre' : 'Læs mere'}
    </button>
  )
  return inline
    ? <>{open ? full : short}{' '}{btn}</>
    : <><div>{open ? full : short}</div>{btn}</>
}
