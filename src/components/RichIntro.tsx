'use client'
import { PortableText } from '@portabletext/react'

const components = {
  block: {
    normal: ({ children }: any) => <>{children}</>,
  },
  marks: {
    strong: ({ children }: any) => <strong>{children}</strong>,
    em:     ({ children }: any) => <em>{children}</em>,
    link:   ({ value, children }: any) => {
      const rel = [value?.nofollow ? 'nofollow' : '', value?.blank ? 'noopener noreferrer' : ''].filter(Boolean).join(' ') || undefined
      return (
        <a
          href={value?.href}
          target={value?.blank ? '_blank' : undefined}
          rel={rel}
          style={{ color: 'var(--green)', textDecoration: 'underline', textDecorationColor: 'rgba(10,95,62,0.4)' }}
        >
          {children}
        </a>
      )
    },
  },
}

/**
 * Renders an intro field which is either:
 *   - a plain string (legacy / fallback)
 *   - a Portable Text array (new rich-text intro)
 *
 * Always renders inline (no wrapping block element) — the parent is
 * responsible for the <p> or container element and its styles.
 */
export function RichIntro({ value }: { value: string | any[] | null | undefined }) {
  if (!value) return null
  if (typeof value === 'string') return <>{value}</>
  return <PortableText value={value} components={components} />
}
