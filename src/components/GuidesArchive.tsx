'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Icon } from './Icon'

interface Guide {
  _id: string
  title: string
  slug?: string
  metaDescription?: string
  featuredImage?: { url?: string; alt?: string }
}

interface Props {
  guides?: Guide[]
  /** Prefix for the guide link, e.g. "/casino-guides". */
  hrefPrefix?: string
  title?: string
  /** Optional rich text rendered between the heading and the list. */
  intro?: React.ReactNode
  /** Optional "see all" link shown under the list. */
  seeAllHref?: string
  seeAllLabel?: string
  /** Show the "(N)" result count next to the title. */
  showCount?: boolean
}

export function GuidesArchive({ guides, hrefPrefix = '/guides', title = 'Alle casinoguider', intro, seeAllHref, seeAllLabel = 'Se alle casinoguider', showCount = true }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const list = guides ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((g) =>
      g.title.toLowerCase().includes(q) || (g.metaDescription ?? '').toLowerCase().includes(q)
    )
  }, [guides, query])

  if (!guides?.length) return null

  return (
    <div className="section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {title}{showCount && <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}> ({filtered.length})</span>}
        </h2>

        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
          <Icon name="magnifer" size={17} color="var(--text-faint)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg guider…"
            aria-label="Søg casinoguider"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px 10px 38px',
              fontSize: '14px', color: 'var(--text)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '10px', outline: 'none',
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Ryd søgning"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <Icon name="close-circle" size={17} color="var(--text-faint)" />
            </button>
          )}
        </div>
      </div>

      {intro && <div style={{ marginBottom: '20px' }}>{intro}</div>}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-faint)', fontSize: '14px' }}>
          Ingen guider matcher &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
          {filtered.map((g) => {
            const href = `${hrefPrefix}/${g.slug}/`
            return (
              <Link key={g._id} href={href} style={{
                display: 'flex', flexDirection: 'column', textDecoration: 'none',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '14px', overflow: 'hidden',
              }}>
                {g.featuredImage?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.featuredImage.url} alt={g.featuredImage.alt || g.title}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--border)' }} />
                )}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Icon name="book-2" size={18} color="var(--green)" style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '15.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                      {g.title}
                    </span>
                  </div>
                  {g.metaDescription && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
                      {g.metaDescription.length > 120 ? g.metaDescription.slice(0, 120) + '…' : g.metaDescription}
                    </p>
                  )}
                  <span style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13.5px', fontWeight: 600, color: 'var(--green)' }}>
                    Læs guide <Icon name="arrow-right" size={14} color="var(--green)" />
                  </span>
                </div>
              </Link>
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
