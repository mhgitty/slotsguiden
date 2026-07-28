'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Icon } from './Icon'

interface Casino {
  _id: string
  name: string
  slug: { current: string }
  usp?: string
  score?: number
  indbetalingsbonus?: string
  url?: string
  logo?: { url?: string; alt?: string }
}

interface Props {
  casinos?: Casino[]
  /** Prefix for the review link, e.g. "/review". */
  hrefPrefix?: string
  title?: string
  /** Optional rich text rendered between the heading and the list. */
  intro?: React.ReactNode
  /** Optional "see all" link shown under the list. */
  seeAllHref?: string
  seeAllLabel?: string
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'var(--green)' : score >= 6 ? '#ca8a04' : '#dc2626'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      background: color, color: '#fff', fontSize: '12px', fontWeight: 800,
      padding: '3px 8px', borderRadius: '16px', flexShrink: 0,
    }}>
      <Icon name="star" size={11} color="#fff" /> {score.toFixed(1)}
    </span>
  )
}

export function CasinoReviewsArchive({ casinos, hrefPrefix = '/review', title = 'Alle casinoanmeldelser', intro, seeAllHref, seeAllLabel = 'Se alle anmeldelser' }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const list = casinos ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.usp ?? '').toLowerCase().includes(q)
    )
  }, [casinos, query])

  if (!casinos?.length) return null

  return (
    <div className="section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {title} <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>({filtered.length})</span>
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
              borderRadius: '10px', outline: 'none',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
          {filtered.map((c) => {
            const href = `${hrefPrefix}/${c.slug.current}/`
            return (
              <div key={c._id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                <Link href={href} style={{
                  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '22px', minHeight: '104px', borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                }}>
                  {c.logo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo.url} alt={c.logo.alt || c.name}
                      style={{ maxWidth: '150px', maxHeight: '60px', objectFit: 'contain', borderRadius: '8px', display: 'block' }} />
                  ) : (
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>{c.name}</span>
                  )}
                </Link>

                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <Link href={href} style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
                      {c.name}
                    </Link>
                    {c.score != null && <ScoreBadge score={c.score} />}
                  </div>

                  {c.usp && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.45 }}>
                      {c.usp}
                    </p>
                  )}

                  {c.indbetalingsbonus && (
                    <div style={{ fontSize: '16px', color: 'var(--green-dark)', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3 }}>
                      {c.indbetalingsbonus}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="nofollow noopener noreferrer sponsored" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        background: 'var(--btn)', color: '#fff',
                        padding: '10px 14px', borderRadius: '8px',
                        fontSize: '14px', fontWeight: 800, textDecoration: 'none',
                      }}>
                        Besøg casino <Icon name="arrow-right" size={15} color="#fff" />
                      </a>
                    )}
                    <Link href={href} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      background: 'var(--bg-raised)', border: '1px solid var(--border)',
                      color: 'var(--text)', padding: '9px 14px', borderRadius: '8px',
                      fontSize: '13.5px', fontWeight: 600, textDecoration: 'none',
                    }}>
                      Læs anmeldelse
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {seeAllHref && (
        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <Link href={seeAllHref} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-raised)', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '11px 20px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 600, textDecoration: 'none',
          }}>
            {seeAllLabel}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
