'use client'

import { useEffect, useRef, useState } from 'react'
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

export function TableOfContents({ body }: { body: any[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const headings = extractHeadings(body)

  // Observe h2s in the page and update activeId
  useEffect(() => {
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: '0px 0px -60% 0px' }
    )
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings.length])

  // Reading progress through the page (0–100)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100))) : 0)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  // Auto-scroll the TOC so the active item stays visible
  useEffect(() => {
    if (!activeId || !navRef.current) return
    const activeEl = itemRefs.current[activeId]
    if (!activeEl) return
    const nav = navRef.current
    const navTop = nav.scrollTop
    const navBottom = navTop + nav.clientHeight
    const elTop = activeEl.offsetTop
    const elBottom = elTop + activeEl.offsetHeight
    if (elTop < navTop || elBottom > navBottom) {
      nav.scrollTo({ top: elTop - nav.clientHeight / 2 + activeEl.offsetHeight / 2, behavior: 'smooth' })
    }
  }, [activeId])

  if (!headings.length) return null

  return (
    <div className="sg-toc">
      <div className="sg-toc-top">
        <span>Indhold</span>
        <span className="sg-toc-pct" aria-hidden="true">{progress}%</span>
      </div>
      <div className="sg-toc-bar" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>

      <nav ref={navRef} className="sg-toc-nav" aria-label="Indholdsfortegnelse">
        <ul>
          {headings.map(({ id, text }) => (
            <li key={id} ref={(el) => { itemRefs.current[id] = el }}>
              <a
                href={`#${id}`}
                className={activeId === id ? 'is-active' : undefined}
                aria-current={activeId === id ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
