'use client'
import { useState, type ReactNode } from 'react'
import { Icon } from './Icon'

/** Shows the first `limit` items and a "show more" button for the rest. */
export function ShowMore({ items, limit, label, className, style }: {
  items: ReactNode[]; limit?: number; label: string; className?: string; style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const visible = open || !limit ? items : items.slice(0, limit)
  const hidden = items.length - visible.length
  return (
    <>
      <div className={className} style={style}>{visible}</div>
      {hidden > 0 && (
        <div className="sm-more">
          <button type="button" className="sg-btn-ghost" onClick={() => setOpen(true)}>
            {label} <span>({hidden})</span> <Icon name="alt-arrow-down" size={16} />
          </button>
        </div>
      )}
    </>
  )
}
