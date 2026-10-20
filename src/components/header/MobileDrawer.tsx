'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/Icon'
import { replaceDateVars } from '@/lib/dateVars'
import { Terms } from '@/components/Terms'
import type { NavItem, NavLink, HeaderCta } from './types'

const FALLBACK_ICON = 'alt-arrow-right'

export function MobileDrawer({ nav, open, onClose, onSearch, cta }: {
  nav: NavItem[]; open: boolean; onClose: () => void; onSearch: () => void; cta: HeaderCta
}) {
  const [expanded, setExpanded] = useState<number | null>(0)
  const featured = nav.find((n) => n.featured)?.featured ?? null

  const subLinks = (l: NavLink) => (
    <Link key={l.href + l.label} href={l.href} onClick={onClose} className="md-sub">
      {l.label}
    </Link>
  )

  return (
    <div className={`md${open ? ' is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="md-top">
        <Link href="/" onClick={onClose} className="md-logo" aria-label="Slotsguiden forside">
          <Image src="/logo.webp" alt="Slotsguiden" height={36} width={200} style={{ height: '30px', width: 'auto', display: 'block' }} />
        </Link>
        <button type="button" className="md-btn" onClick={onClose} aria-label="Luk menu">
          <Icon name="close-circle" size={20} />
        </button>
      </div>

      <div className="md-body">
        <button type="button" className="md-search" onClick={onSearch}>
          <Icon name="magnifer" size={18} color="var(--green)" />
          Søg efter casino, bonus eller guide…
        </button>

        <div className="md-acc">
          {nav.map((item, i) => {
            const hasKids = item.children.length > 0
            const isOpen = expanded === i
            if (!hasKids) {
              return (
                <div key={item.href + item.label} className="md-item">
                  <Link href={item.href} onClick={onClose} className="md-row">
                    <span className="md-chip"><Icon name={item.icon || FALLBACK_ICON} size={17} /></span>
                    {item.label}
                  </Link>
                </div>
              )
            }
            return (
              <div key={item.href + item.label} className={`md-item${isOpen ? ' is-open' : ''}`}>
                <button type="button" className="md-row" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : i)}>
                  <span className="md-chip"><Icon name={item.icon || FALLBACK_ICON} size={17} /></span>
                  {item.label}
                  <Icon name="alt-arrow-down" size={14} className="md-chev" />
                </button>
                <div className="md-panel">
                  {item.children.map((c) => (c.children?.length ?? 0) > 0 ? (
                    <div key={c.href + c.label} className="md-group">
                      <Link href={c.href} onClick={onClose} className="md-sub md-sub-strong">{c.label}</Link>
                      <div className="md-chips">
                        {c.children!.slice(0, 12).map((g) => (
                          <Link key={g.href + g.label} href={g.href} onClick={onClose} className="mm-chip">{g.label}</Link>
                        ))}
                      </div>
                    </div>
                  ) : subLinks(c))}
                  <Link href={item.href} onClick={onClose} className="md-sub md-all">
                    Se alle <Icon name="arrow-right" size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <Link href={cta.href} onClick={onClose} className="md-cta">
          <Icon name="star" size={16} color="var(--gold)" /> {cta.label}
        </Link>

        {featured && (
          <div className="md-feat">
            {featured.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.logo} alt={featured.name} width={44} height={44} loading="lazy" />
            )}
            <div>
              <b>{featured.name}{featured.score != null && <> · <span style={{ color: 'var(--gold)' }}>★</span> {featured.score.toFixed(1)}</>}</b>
              {featured.indbetalingsbonus && <small>{replaceDateVars(featured.indbetalingsbonus)}</small>}
            </div>
            {featured.url && (
              <a href={featured.url} target="_blank" rel="nofollow noopener noreferrer sponsored" className="sg-cta md-feat-cta">
                Hent bonus <Icon name="arrow-right" size={16} color="#fff" />
              </a>
            )}
            <div className="md-feat-terms"><Terms html={featured.terms || '18+ | Regler og vilkår gælder | Spil ansvarligt'} /></div>
          </div>
        )}
      </div>

      <div className="md-foot">18+ · Spil ansvarligt · Regler og vilkår gælder · Selvudelukkelse via ROFUS</div>
    </div>
  )
}
