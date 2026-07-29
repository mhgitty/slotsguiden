'use client'
import { useState } from 'react'
import { PortableText } from '@portabletext/react'
import { Icon } from '@/components/Icon'

const innerComponents = {
  block: {
    normal: ({ children }: any) => (
      <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.75, margin: '0 0 14px' }}>{children}</p>
    ),
    h3: ({ children }: any) => (
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: '16px 0 8px' }}>{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '14px 0 6px' }}>{children}</h4>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul style={{ paddingLeft: '20px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</ul>,
    number: ({ children }: any) => <ol style={{ paddingLeft: '24px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</li>,
    number: ({ children }: any) => <li style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</li>,
  },
  marks: {
    strong: ({ children }: any) => <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ value, children }: any) => (
      <a
        href={value?.href}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        style={{ color: 'var(--green)', textDecoration: 'underline', textDecorationColor: 'rgba(10,95,62,0.4)' }}
      >
        {children}
      </a>
    ),
  },
}

interface DropdownBlockProps {
  value: {
    title?: string
    content?: any[]
    defaultOpen?: boolean
  }
}

export function DropdownBlock({ value }: DropdownBlockProps) {
  const [open, setOpen] = useState(value.defaultOpen ?? false)

  if (!value.title) return null

  return (
    <div style={{
      margin: '16px 0',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={open}
      >
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '15.5px',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.4,
          margin: 0,
        }}>
          {value.title}
        </h2>
        <span style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: open ? 'rgba(10,95,62,0.12)' : 'var(--bg-raised)',
          border: `1px solid ${open ? 'rgba(10,95,62,0.3)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, background 0.15s, border-color 0.15s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <Icon name="alt-arrow-down" size={14} color={open ? 'var(--green)' : 'var(--text-muted)'} />
        </span>
      </button>

      {/* Content */}
      {open && value.content && value.content.length > 0 && (
        <div style={{
          padding: '0 20px 18px',
          borderTop: '1px solid var(--border)',
          paddingTop: '16px',
        }}>
          <PortableText value={value.content} components={innerComponents} />
        </div>
      )}
    </div>
  )
}
