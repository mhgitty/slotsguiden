'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { MegaPanel } from './MegaPanel'
import { MobileDrawer } from './MobileDrawer'
import { SearchDialog } from './SearchDialog'
import type { NavItem, HeaderCta } from './types'

const OPEN_DELAY = 90
const CLOSE_DELAY = 160

export function SiteHeader({ nav, cta }: { nav: NavItem[]; cta: HeaderCta }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [today, setToday] = useState(-1)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const openSoon = (i: number) => {
    clearTimers()
    if (open !== null) { setOpen(i); return }          // already browsing: switch instantly
    openTimer.current = setTimeout(() => setOpen(i), OPEN_DELAY)
  }
  const closeSoon = () => {
    clearTimers()
    closeTimer.current = setTimeout(() => setOpen(null), CLOSE_DELAY)
  }
  const closeAll = useCallback(() => { clearTimers(); setOpen(null); setMobileOpen(false) }, [])

  // Weekday for the free-spins panel (client-only to avoid a server/client mismatch)
  useEffect(() => { setToday((new Date().getDay() + 6) % 7) }, [])

  // Close everything on navigation
  useEffect(() => { closeAll() }, [pathname, closeAll])

  // Slimmer header with a shadow once the page has scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Esc closes the menu; "/" opens search (unless typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(null); return }
      const t = e.target as HTMLElement | null
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); setOpen(null); setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    document.body.classList.toggle('menu-open', mobileOpen)
    return () => document.body.classList.remove('menu-open')
  }, [mobileOpen])

  const openSearch = () => { setOpen(null); setMobileOpen(false); setSearchOpen(true) }

  return (
    <>
      <header className={`navbar sgh${scrolled ? ' is-scrolled' : ''}${open !== null ? ' has-open' : ''}`} onMouseLeave={closeSoon}>
        <div className="sgh-in">
          <Link href="/" className="sgh-logo" aria-label="Slotsguiden forside">
            <Image src="/logo.webp" alt="Slotsguiden" height={36} width={200} style={{ height: '34px', width: 'auto', display: 'block' }} priority />
          </Link>

          <nav className="sgh-nav" aria-label="Hovedmenu">
            {nav.map((item, i) => {
              const hasPanel = item.children.length > 0
              if (!hasPanel) {
                return (
                  <Link key={item.href + item.label} href={item.href} className={`sgh-link${item.isHighlighted ? ' is-cta' : ''}`}>
                    {item.label}
                  </Link>
                )
              }
              const isOpen = open === i
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`sgh-link${isOpen ? ' is-open' : ''}`}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  aria-controls={`mega-${i}`}
                  onMouseEnter={() => openSoon(i)}
                  onFocus={() => { clearTimers(); setOpen(i) }}
                  onClick={(e) => {
                    // Touch screens: first tap opens the panel, the panel's own links navigate
                    if (!isOpen && window.matchMedia('(hover: none)').matches) { e.preventDefault(); setOpen(i) }
                  }}
                >
                  {item.label}
                  <Icon name="alt-arrow-down" size={13} className="sgh-chev" />
                </Link>
              )
            })}
          </nav>

          <div className="sgh-right">
            <button type="button" className="sgh-search" onClick={openSearch} aria-label="Søg på Slotsguiden">
              <Icon name="magnifer" size={17} />
              <span className="sgh-search-text">Søg</span>
              <kbd>/</kbd>
            </button>
            <Link href={cta.href} className="sgh-cta">
              <Icon name="star" size={15} color="var(--gold)" />
              {cta.label}
            </Link>
            <button
              type="button"
              className="sgh-burger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Luk menu' : 'Åbn menu'}
              aria-expanded={mobileOpen}
            >
              <span className={`burger-icon${mobileOpen ? ' open' : ''}`}><span /><span /><span /></span>
            </button>
          </div>
        </div>

        {/* Mega panels: always in the DOM (so the links are crawlable), shown one at a time */}
        <div className="sgh-panels" onMouseEnter={clearTimers}>
          {nav.map((item, i) => item.children.length > 0 && (
            <div
              key={item.href + item.label}
              id={`mega-${i}`}
              className={`sgh-panel${open === i ? ' is-open' : ''}`}
              aria-hidden={open !== i}
              inert={open !== i}
            >
              <MegaPanel item={item} today={today} onNavigate={closeAll} />
            </div>
          ))}
        </div>
      </header>

      <div className={`sgh-dim${open !== null ? ' is-on' : ''}`} aria-hidden="true" />

      <MobileDrawer nav={nav} open={mobileOpen} onClose={() => setMobileOpen(false)} onSearch={openSearch} cta={cta} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
