'use client'

import { useEffect, useRef } from 'react'

/**
 * Renders a raw HTML embed (e.g. the game-demo widget migrated from WordPress).
 * The markup is server-rendered for SEO/no-layout-shift, then on mount any
 * <script> tags are re-created so they actually execute (React does not run
 * scripts inserted via innerHTML / dangerouslySetInnerHTML).
 */
export function HtmlBlock({ value }: { value?: { html?: string } }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const scripts = Array.from(container.querySelectorAll('script'))
    for (const old of scripts) {
      const s = document.createElement('script')
      for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value)
      s.text = old.textContent || ''
      old.parentNode?.replaceChild(s, old)
    }
  }, [])

  if (!value?.html) return null

  return (
    <div
      ref={ref}
      className="html-embed"
      style={{ margin: '24px 0' }}
      dangerouslySetInnerHTML={{ __html: value.html }}
    />
  )
}
