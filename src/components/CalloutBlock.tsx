import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { getAuthorById } from '@/lib/sanity'

interface CalloutBlockProps {
  value: {
    variant?: 'info' | 'tip' | 'warning' | 'quote'
    title?: string
    body?: any[] | string
    author?: { _ref?: string }
  }
}

const styles: Record<string, { bg: string; border: string; icon: string; color: string }> = {
  info:    { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', icon: 'ℹ️', color: '#60a5fa' },
  tip:     { bg: 'rgba(255,205,0,0.12)',  border: 'rgba(255,205,0,0.35)',  icon: '💡', color: '#A77E00' },
  warning: { bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.25)',  icon: '⚠️', color: '#fbbf24' },
  quote:   { bg: 'var(--bg-raised)',     border: 'var(--border)',         icon: '',   color: 'var(--text)' },
}

const richTextComponents = {
  block: {
    normal: ({ children }: any) => (
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 8px' }}>{children}</p>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 8px', paddingLeft: '20px' }}>{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 8px', paddingLeft: '20px' }}>{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li style={{ marginBottom: '4px' }}>{children}</li>,
    number: ({ children }: any) => <li style={{ marginBottom: '4px' }}>{children}</li>,
  },
  marks: {
    strong: ({ children }: any) => <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ value, children }: any) => {
      const relParts = ['noopener', 'noreferrer', value?.nofollow ? 'nofollow' : ''].filter(Boolean)
      return (
        <a href={value?.href} target={value?.blank ? '_blank' : undefined} rel={relParts.join(' ')}
          style={{ color: 'inherit', textDecoration: 'underline' }}>
          {children}
        </a>
      )
    },
  },
}

export async function CalloutBlock({ value }: CalloutBlockProps) {
  const { variant = 'info', title, body, author } = value
  const s = styles[variant] ?? styles.info
  const isQuote = variant === 'quote'

  // Resolve the credited author (optional) at render time.
  let person = null
  if (author?._ref) {
    try {
      person = await getAuthorById(author._ref)
    } catch {
      person = null
    }
  }

  return (
    <div
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderLeft: isQuote ? '4px solid var(--green)' : `1px solid ${s.border}`,
        borderRadius: '8px',
        padding: '16px 20px',
        margin: '24px 0',
      }}
    >
      {title && (
        <div style={{ fontWeight: 600, color: s.color, fontSize: isQuote ? '16px' : '14.5px', marginBottom: '8px' }}>
          {s.icon ? `${s.icon} ` : ''}{title}
        </div>
      )}
      {body && (
        <div style={{ lineHeight: 1.65 }}>
          {Array.isArray(body)
            ? <PortableText value={body} components={richTextComponents} />
            : <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{body}</p>
          }
        </div>
      )}

      {person?.name && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginTop: '14px', paddingTop: '12px',
            borderTop: `1px solid ${s.border}`,
          }}
        >
          {person.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.imageUrl}
              alt={person.name}
              loading="lazy"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <div style={{ lineHeight: 1.3 }}>
            {person.slug?.current ? (
              <Link
                href={`/author/${person.slug.current}/`}
                style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}
              >
                {person.name}
              </Link>
            ) : (
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{person.name}</span>
            )}
            {person.role && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{person.role}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
