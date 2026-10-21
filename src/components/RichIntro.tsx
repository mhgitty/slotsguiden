'use client'
import { PortableText } from '@portabletext/react'
import { truncatePT } from '@/lib/truncatePT'
import { ReadMore } from '@/components/ReadMore'

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
function Render({ value }: { value: string | any[] }) {
  if (typeof value === 'string') return <>{value}</>
  return <PortableText value={value} components={components} />
}

/** maxWords: show only the first N words, with a "Læs mere" button for the rest. */
export function RichIntro({ value, maxWords }: { value: string | any[] | null | undefined; maxWords?: number }) {
  if (!value) return null
  const short = maxWords ? truncatePT(value, maxWords) : null
  if (!short) return <Render value={value} />
  return <ReadMore short={<Render value={short} />} full={<Render value={value} />} />
}
