/**
 * HreflangHead — server component
 *
 * Parses a raw <link rel="alternate" hreflang="..."> HTML block from Sanity
 * and renders the individual <link> elements. In Next.js 15 / React 19 these
 * are automatically hoisted into <head> when rendered from a server component.
 *
 * Usage:
 *   <HreflangHead script={doc.hreflangScript} />
 *   or
 *   <HreflangHead script={await getHreflangScript(doc._id)} />
 */

interface LinkTag {
  hreflang: string
  href: string
}

function parseLinks(script: string): LinkTag[] {
  const tags: LinkTag[] = []
  // Match every <link ... > tag in the block
  const tagRe = /<link\b[^>]*>/gi
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = tagRe.exec(script)) !== null) {
    const tag = tagMatch[0]
    const hreflang = tag.match(/hreflang=["']([^"']+)["']/)
    const href     = tag.match(/href=["']([^"']+)["']/)
    if (hreflang && href) {
      tags.push({ hreflang: hreflang[1], href: href[1] })
    }
  }
  return tags
}

export function HreflangHead({ script }: { script?: string | null }) {
  if (!script) return null
  const links = parseLinks(script)
  if (links.length === 0) return null

  return (
    <>
      {links.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
    </>
  )
}
