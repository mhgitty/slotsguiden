'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Tags every internal /r/ tracking link with the page it was clicked from by
// appending ?placement=<current path>. The /r/ redirect then forwards it to
// the affiliate URL. Runs after hydration and re-applies when new links appear
// (pop-ups, flyouts, client-rendered sections).
export function TrackingPlacement() {
  const pathname = usePathname()

  useEffect(() => {
    const path = pathname || window.location.pathname
    let scheduled = false

    const apply = () => {
      scheduled = false
      document.querySelectorAll<HTMLAnchorElement>('a[href*="/r/"]').forEach((a) => {
        let u: URL
        try { u = new URL(a.href) } catch { return }
        if (u.origin !== window.location.origin) return       // only our own links
        if (!u.pathname.startsWith('/r/')) return              // only /r/ redirects
        if (u.searchParams.get('placement') === path) return   // already set — avoids loops
        u.searchParams.set('placement', path)
        a.href = u.toString()
      })
    }

    const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(apply) } }
    schedule()

    const obs = new MutationObserver(schedule)
    obs.observe(document.body, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [pathname])

  return null
}
