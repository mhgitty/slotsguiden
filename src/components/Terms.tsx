import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { sanitizeTermsHtml } from '@/lib/sanitizeHtml'

interface TermsProps {
  // Rich text (Portable Text) is the new format; a plain string is still
  // accepted for legacy data and the built-in default terms.
  html?: string | any[] | null
  className?: string
  style?: React.CSSProperties
}

// Inline rendering: blocks render without <p> wrappers (a bare fragment) so the
// output drops safely into existing <p>/<span>/<div> containers.
const inlineComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <>{children}{' '}</>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }: any) => {
      const rel = ['noopener', 'noreferrer', value?.nofollow ? 'nofollow' : ''].filter(Boolean).join(' ')
      return (
        <a href={value?.href} target={value?.blank ? '_blank' : undefined} rel={rel}>
          {children}
        </a>
      )
    },
  },
}

/**
 * Renders a casino/bonus `terms` value. Accepts Portable Text (rich text with
 * links, added in Studio without HTML) or a plain string (legacy data / the
 * built-in default). Always renders inline so it can sit inside existing
 * <p>/<span> wrappers.
 */
export function Terms({ html, className, style }: TermsProps) {
  if (!html) return null
  const cls = `terms-html${className ? ` ${className}` : ''}`

  // Rich text (Portable Text)
  if (Array.isArray(html)) {
    if (html.length === 0) return null
    return (
      <span className={cls} style={style}>
        <PortableText value={html} components={inlineComponents} />
      </span>
    )
  }

  // Legacy / default: plain string, possibly containing inline HTML.
  const clean = sanitizeTermsHtml(String(html))
  if (!clean) return null
  return <span className={cls} style={style} dangerouslySetInnerHTML={{ __html: clean }} />
}
