import { sanitizeTermsHtml } from '@/lib/sanitizeHtml'

interface TermsProps {
  html?: string | null
  className?: string
  style?: React.CSSProperties
}

/**
 * Renders a casino/bonus `terms` string. The value may contain inline HTML
 * (notably <a> links to the operator's T&C), so it's sanitised and injected.
 * Renders as an inline <span> so it can drop into existing <p>/<div> wrappers.
 */
export function Terms({ html, className, style }: TermsProps) {
  if (!html) return null
  const clean = sanitizeTermsHtml(html)
  if (!clean) return null
  return (
    <span
      className={`terms-html${className ? ` ${className}` : ''}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
