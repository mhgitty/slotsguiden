'use client'
import { useEffect, useRef, useState } from 'react'
import { Terms } from './Terms'

interface StickyCtaBarProps {
  url: string
  name: string
  logoUrl?: string | null
  logoAlt?: string | null
  bonus?: string | null
  terms?: string | null
}

export function StickyCtaBar({ url, name, logoUrl, logoAlt, bonus, terms }: StickyCtaBarProps) {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Invisible sentinel placed at the bottom of the hero */}
      <div ref={sentinelRef} style={{ height: 0 }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 50,
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s ease',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Inner — matches body max-width */}
        <div className="sticky-cta-inner">

          {/* Logo + name + bonus */}
          <div className="sticky-cta-main">
            {logoUrl && (
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#1a1a2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img
                  src={logoUrl}
                  alt={logoAlt || name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '16px', fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {name}
              </div>
              {bonus && (
                <div style={{
                  fontSize: 'clamp(20px, 5.5vw, 24px)', fontWeight: 800,
                  color: 'var(--green)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}>
                  {bonus}
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="sticky-cta-terms">
            {terms ? <Terms html={terms} /> : '18+ | Kun nye spillere | Vilkår gælder'}
          </div>

          {/* CTA button */}
          <a
            className="sticky-cta-btn"
            href={url}
            target="_blank"
            rel="nofollow noopener noreferrer sponsored"
            style={{
              flexShrink: 0,
              background: 'var(--btn)',
              color: '#fff',
              padding: '13px 26px',
              borderRadius: '9px',
              fontSize: '15px',
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              boxShadow: '0 2px 12px rgba(10,95,62,0.3)',
            }}
          >
            SPIL NU
          </a>
        </div>
      </div>
    </>
  )
}
