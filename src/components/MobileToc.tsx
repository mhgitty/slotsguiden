'use client'

import { Icon } from '@/components/Icon'

import { useState } from 'react'
import { headingId } from '@/lib/headingId'

interface Heading {
  id: string
  text: string
}

function extractHeadings(body: any[]): Heading[] {
  if (!body?.length) return []
  return body
    .filter((block: any) => block._type === 'block' && block.style === 'h2')
    .map((block: any) => {
      const text = block.children?.map((c: any) => c.text).join('') || ''
      return { id: headingId(text), text }
    })
    .filter((h) => h.text.length > 0)
}

export function MobileToc({ body }: { body: any[] }) {
  const [open, setOpen] = useState(false)
  const headings = extractHeadings(body)

  if (!headings.length) return null

  return (
    <div className="mobile-toc" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '28px',
      overflow: 'hidden',
    }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: '8px',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.01em',
        }}>
          Indholdsfortegnelse
        </span>
        <Icon name="alt-arrow-down" size={16} style={{ flexShrink: 0, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      </button>

      {/* Collapsible list */}
      {open && (
        <ul style={{
          listStyle: 'none',
          padding: '0 18px 14px',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          borderTop: '1px solid var(--border-faint)',
          paddingTop: '10px',
        }}>
          {headings.map(({ id, text }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                style={{
                  display: 'block',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '5px 0 5px 10px',
                  borderLeft: '2px solid var(--border)',
                }}
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  setTimeout(() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 50)
                }}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
