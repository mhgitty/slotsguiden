'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Icon } from './Icon'
import { Terms } from './Terms'
import { replaceDateVars } from '@/lib/dateVars'

const DEFAULT_TERMS = '18+ | Spil ansvarligt | Vilkår gælder'

interface Casino {
  _id: string
  name: string
  slug: { current: string }
  usp?: string
  score?: number
  indbetalingsbonus?: string
  url?: string
  terms?: string
  logo?: { url?: string; alt?: string }
  logoSquare?: { url?: string; alt?: string }
}

interface Props {
  casinos?: Casino[]
  /** Prefix for the review link, e.g. "/online-casino". */
  hrefPrefix?: string
  title?: string
  /** Optional rich text rendered between the heading and the list. */
  intro?: React.ReactNode
  /** Optional "see all" link shown under the list. */
  seeAllHref?: string
  seeAllLabel?: string
  /** Show the "(N)" result count next to the title. */
  showCount?: boolean
  /** How many casinos to show by default (before searching). Searching still
   *  matches across the full `casinos` list. Omit to show all. */
  initialCount?: number
}

export function CasinoReviewsArchive({ casinos, hrefPrefix = '/online-casino', title = 'Alle casinoanmeldelser', intro, seeAllHref, seeAllLabel = 'Se alle anmeldelser', showCount = true, initialCount }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const list = casinos ?? []
    const q = query.trim().toLowerCase()
    // No query: show the curated/limited default set. Searching matches the FULL list.
    if (!q) return typeof initialCount === 'number' ? list.slice(0, initialCount) : list
    return list.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.usp ?? '').toLowerCase().includes(q)
    )
  }, [casinos, query, initialCount])

  if (!casinos?.length) return null

  return (
    <div className="section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {replaceDateVars(title)}{showCount && <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}> ({filtered.length})</span>}
        </h2>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
          <Icon name="magnifer" size={17} color="var(--text-faint)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg casino…"
            aria-label="Søg casinoanmeldelser"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px 10px 38px',
              fontSize: '14px', color: 'var(--text)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', outline: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Ryd søgning"
              style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px',
              }}
            >
              <Icon name="close-circle" size={17} color="var(--text-faint)" />
            </button>
          )}
        </div>
      </div>

      {intro && <div style={{ marginBottom: '20px' }}>{intro}</div>}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-faint)', fontSize: '14px' }}>
          Ingen resultater for &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="sgc-grid">
          {filtered.map((c) => {
            const href = `${hrefPrefix}/${c.slug.current}/`
            const square = c.logoSquare?.url ? c.logoSquare : null
            const logo = square || (c.logo?.url ? c.logo : null)
            const isSquare = !!square
            return (
              <div key={c._id} className="sgc-card">
                <div className="sgc-card-head">
                  <Link href={href} className={`sgc-card-logo${isSquare ? '' : ' is-wide'}`} tabIndex={-1} aria-hidden="true">
                    {logo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo.url} alt={logo.alt || c.name} loading="lazy" />
                    ) : (
                      <span>{c.name.slice(0, 2)}</span>
                    )}
                  </Link>
                  <div className="sgc-card-id">
                    <Link href={href} className="sgc-card-name">{c.name}</Link>
                    {c.score != null && (
                      <span className="sgc-rating">
                        <Icon name="star" size={14} color="var(--gold)" />
                        {c.score.toFixed(1)}<span>/10</span>
                      </span>
                    )}
                  </div>
                </div>

                {c.usp && <p className="sgc-card-usp">{c.usp}</p>}

                {c.indbetalingsbonus && (
                  <div className="sgc-card-offer">
                    <small>Velkomstbonus</small>
                    <strong>{c.indbetalingsbonus}</strong>
                  </div>
                )}

                <div className="sgc-card-actions">
                  {c.url && (
                    <a href={c.url} target="_blank" rel="nofollow noopener noreferrer sponsored" className="sg-cta">
                      Besøg casino <Icon name="arrow-right" size={16} color="#fff" />
                    </a>
                  )}
                  <Link href={href} className="sgc-card-link">Læs anmeldelse</Link>
                </div>

                {/* Terms — required for compliance. Fixed height + scroll so
                    cards stay aligned regardless of terms length. */}
                <div className="sgc-card-terms">
                  <Terms html={c.terms || DEFAULT_TERMS} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {seeAllHref && (
        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <Link href={seeAllHref} className="sg-btn-ghost">
            {seeAllLabel}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
