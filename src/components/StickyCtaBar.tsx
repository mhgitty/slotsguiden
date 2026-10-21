'use client'
import { useEffect, useRef, useState } from 'react'
import { Terms } from './Terms'
import { Icon } from './Icon'

interface StickyCtaBarProps {
  url: string
  name: string
  logoUrl?: string | null
  logoAlt?: string | null
  bonus?: string | null
  terms?: string | any[] | null
  minDeposit?: number | string | null
  wagering?: string | null
}

/**
 * Bonus bar fixed to the bottom of review pages. It slides in only once the
 * reader has scrolled past the hero (the sentinel sits right under it), and
 * hides again when they scroll back to the top.
 */
export function StickyCtaBar({ url, name, logoUrl, logoAlt, bonus, terms, minDeposit, wagering }: StickyCtaBarProps) {
  const [visible, setVisible] = useState(false)
  const [openTerms, setOpenTerms] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    // Visible only when the sentinel has left the screen through the TOP,
    // i.e. the hero is scrolled past. Below the screen (page just opened) = hidden.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const chips = [
    minDeposit != null && minDeposit !== '' ? `Min. indbetaling ${typeof minDeposit === 'number' ? `${minDeposit} kr.` : minDeposit}` : null,
    wagering && wagering.trim() !== '-' ? `Omsætningskrav ${wagering}` : null,
  ].filter(Boolean) as string[]

  return (
    <>
      {/* Invisible sentinel placed at the bottom of the hero */}
      <div ref={sentinelRef} style={{ height: 0 }} aria-hidden="true" />

      <div className={`scb${visible ? ' is-on' : ''}`} aria-hidden={!visible}>
        <div className="scb-in">
          <div className="scb-row">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="scb-logo" src={logoUrl} alt={logoAlt || name} width={48} height={48} />
            )}
            <div className="scb-id">
              <span className="scb-name">{name}</span>
              {bonus && <span className="scb-bonus">{bonus}</span>}
            </div>
            {chips.length > 0 && (
              <div className="scb-chips">{chips.map((c) => <span key={c}>{c}</span>)}</div>
            )}
            <a className="sg-cta scb-btn" href={url} target="_blank" rel="nofollow noopener noreferrer sponsored" tabIndex={visible ? 0 : -1}>
              Spil nu <Icon name="arrow-right" size={16} color="#fff" />
            </a>
          </div>
          {/* Small print: two lines; tap to read all of it */}
          <div className={`scb-terms${openTerms ? ' is-open' : ''}`} onClick={() => setOpenTerms((o) => !o)} title={openTerms ? undefined : 'Tryk for at læse alle vilkår'}>
            {terms ? <Terms html={terms} /> : '18+ | Kun nye spillere | Vilkår gælder'}
          </div>
        </div>
      </div>
    </>
  )
}
