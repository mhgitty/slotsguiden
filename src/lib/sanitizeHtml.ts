/**
 * Minimal HTML sanitiser for the casino/bonus `terms` field.
 *
 * Terms are first-party content imported from our own WordPress, but we still
 * allow-list a small set of inline tags and neutralise anything script-y before
 * injecting via dangerouslySetInnerHTML. Only inline formatting + links are kept.
 */

const ALLOWED_TAGS = new Set(['a', 'b', 'strong', 'em', 'i', 'u', 'br', 'span'])

/** Strip every tag, returning plain text (for meta descriptions etc.). */
export function stripHtml(html?: string | null): string {
  if (!html) return ''
  return String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

/** True if the string appears to contain HTML tags. */
export function looksLikeHtml(s?: string | null): boolean {
  return !!s && /<[a-z][\s\S]*>/i.test(s)
}

/** Sanitise a terms string for safe rendering with dangerouslySetInnerHTML. */
export function sanitizeTermsHtml(html?: string | null): string {
  if (!html) return ''
  let s = String(html)

  // Drop script/style blocks and HTML comments entirely.
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  s = s.replace(/<!--[\s\S]*?-->/g, '')

  // Remove inline event handlers (on*="...").
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  // Neutralise javascript: URLs.
  s = s.replace(/href\s*=\s*("|')\s*javascript:[^"']*\1/gi, 'href="#"')

  // Strip any tag not in the allow-list, keeping its inner text.
  s = s.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (match, tag) =>
    ALLOWED_TAGS.has(String(tag).toLowerCase()) ? match : ''
  )

  // Normalise anchors: force safe target/rel, dropping any existing ones.
  s = s.replace(/<a\b([^>]*)>/gi, (_m, attrs) => {
    const cleaned = String(attrs).replace(/\s(target|rel)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    return `<a${cleaned} target="_blank" rel="nofollow noopener noreferrer">`
  })

  return s.trim()
}
