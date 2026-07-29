'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!

// ── Map pathname → Studio edit intent URL ─────────────────────────────────────
function resolveEditUrl(pathname: string): string | null {
  const s = '/studio/intent/edit'

  // Strip trailing slash for matching, keep for display
  const p = pathname.replace(/\/$/, '') || '/'

  // Singletons
  if (p === '/')    return '/studio/structure/%F0%9F%8F%A0%20Homepage'

  // Blog post  /[slug]
  const postMatch = p.match(/^\/([^/]+)$/)
  if (postMatch) return `${s}/type=post,slug.current=="${postMatch[1]}"/`

  // Review  /online-casino/[slug]
  const reviewMatch = p.match(/^\/online-casino\/([^/]+)$/)
  if (reviewMatch) return `${s}/type=bookmaker,slug.current=="${reviewMatch[1]}"/`

  // Page  /[slug] or /[parent]/[slug]
  const pageMatch = p.match(/^\/(.+)$/)
  if (pageMatch) {
    const slug = pageMatch[1].split('/').pop() ?? pageMatch[1]
    return `${s}/type=page,slug.current=="${slug}"/`
  }

  return null
}

// ── Label for current page type ───────────────────────────────────────────────
function pageLabel(pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/'
  if (p === '/')   return 'Forside'
  if (p.match(/\/online-casino\//)) return 'Casinoanmeldelse'
  if (p.match(/\/news\//))   return 'Nyheder'
  if (p.match(/^\/[^/]+$/)) return 'Indlæg / Side'
  return 'Side'
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminBar() {
  const [user, setUser]     = useState<{ name?: string; email?: string } | null>(null)
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Check Sanity auth via the users/me endpoint (uses Studio session cookies)
    fetch(`https://${PROJECT_ID}.api.sanity.io/v2021-06-07/users/me`, {
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.id) {
          setUser(data)
          setVisible(true)
          // Push page content down so bar doesn't overlay navbar
          document.documentElement.style.setProperty('--admin-bar-height', '36px')
        }
      })
      .catch(() => {})
  }, [])

  if (!visible) return null

  const editUrl  = resolveEditUrl(pathname)
  const label    = pageLabel(pathname)
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '36px',
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '0 12px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* Brand */}
      <Link href="/studio" style={{
        color: '#94a3b8',
        textDecoration: 'none',
        fontWeight: 700,
        fontSize: '13px',
        marginRight: '8px',
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}>
        Slotsguiden
      </Link>

      <div style={{ width: '1px', height: '16px', background: '#1e293b', margin: '0 6px' }} />

      {/* Edit this page */}
      {editUrl && (
        <a href={editUrl} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          color: '#e2e8f0',
          textDecoration: 'none',
          padding: '4px 10px',
          borderRadius: '5px',
          background: 'rgba(255,255,255,0.06)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Rediger {label}
        </a>
      )}

      {/* New post shortcut */}
      <a href="/studio/intent/create/type=post/" style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        color: '#94a3b8',
        textDecoration: 'none',
        padding: '4px 10px',
        borderRadius: '5px',
        whiteSpace: 'nowrap',
      }}>
        + Nyt indlæg
      </a>

      {/* New 301 redirect shortcut */}
      <a href="/studio/intent/create/type=pageRedirect/" style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        color: '#94a3b8',
        textDecoration: 'none',
        padding: '4px 10px',
        borderRadius: '5px',
        whiteSpace: 'nowrap',
      }}>
        + Ny omdirigering
      </a>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Studio link */}
      <a href="/studio" style={{
        color: '#94a3b8',
        textDecoration: 'none',
        padding: '4px 10px',
        borderRadius: '5px',
        whiteSpace: 'nowrap',
      }}>
        Studio
      </a>

      <div style={{ width: '1px', height: '16px', background: '#1e293b', margin: '0 4px' }} />

      {/* User avatar */}
      <div title={user?.email ?? ''} style={{
        width: '24px', height: '24px',
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.25)',
        border: '1px solid rgba(34,197,94,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 700,
        color: '#4ade80',
        cursor: 'default',
        flexShrink: 0,
      }}>
        {initials}
      </div>

    </div>
  )
}
