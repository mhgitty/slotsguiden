'use client'
import { Children, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** How many items to show before the "load more" button. */
  initial?: number
  /** Class applied to the grid wrapper. */
  className?: string
  moreLabel?: string
}

/**
 * Wraps a set of server-rendered cards and reveals only the first `initial`,
 * with a "load more" button that shows the rest. Purely presentational —
 * the cards themselves are rendered on the server and passed as children.
 */
export function LoadMoreGrid({ children, initial = 10, className = 'blog-grid', moreLabel = 'Vis flere' }: Props) {
  const items = Children.toArray(children)
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const visible = expanded ? items : items.slice(0, initial)
  const hasMore = items.length > initial

  return (
    <>
      <div className={className}>{visible}</div>
      {hasMore && !expanded && (
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              display: 'inline-block', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '12px 28px', fontSize: '15px', fontWeight: 700, color: 'var(--text)',
              background: 'var(--bg-card)', cursor: 'pointer',
            }}
          >
            {moreLabel} ({items.length - initial})
          </button>
        </div>
      )}
    </>
  )
}
