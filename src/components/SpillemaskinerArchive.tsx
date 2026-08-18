'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Game {
  _id: string
  name: string
  slug: string
  featuredImage?: { url?: string; alt?: string }
}

interface Props {
  games: Game[]
  /** How many to show before the "show more" button. */
  initialCount?: number
  title?: string
  moreLabel?: string
}

const PlayIcon = ({ size = 20, color = 'var(--green)' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.76-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" />
  </svg>
)

/** Strip the "Anmeldelse – Gratis Demo / Gratis Spillemaskine Demo …" boilerplate
 *  so the card shows just the game name. Falls back to the raw name. */
function cleanGameName(raw: string): string {
  const cleaned = (raw || '')
    .replace(/\s*Anmeldelse\b.*$/i, '')
    .replace(/\s*Gratis Spillemaskine Demo\b.*$/i, '')
    .replace(/\s*[–—-]\s*Gratis Demo\b.*$/i, '')
    .replace(/\s*Gratis Demo\b.*$/i, '')
    .trim()
  return cleaned || raw
}

export function SpillemaskinerArchive({ games, initialCount = 20, title, moreLabel = 'Vis flere spillemaskiner' }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!games?.length) return null

  const visible = expanded ? games : games.slice(0, initialCount)
  const hasMore = games.length > initialCount

  return (
    <div className="section">
      {title && (
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
          {title}
        </h2>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '22px' }}>
        {visible.map((g) => (
          <Link key={g._id} href={`/online-spillemaskiner/${g.slug}/`} className="slot-card"
            style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-card)', textDecoration: 'none' }}>
            <div className="slot-card__media" style={{ position: 'relative', width: '100%', aspectRatio: '16/10', background: 'var(--bg-raised)' }}>
              {g.featuredImage?.url && (
                <Image src={g.featuredImage.url} alt={g.featuredImage.alt ?? g.name} fill style={{ objectFit: 'cover', objectPosition: 'center' }} sizes="(max-width: 768px) 50vw, 260px" />
              )}
              {/* subtle bottom gradient for depth */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.25), rgba(0,0,0,0) 42%)', pointerEvents: 'none' }} />
              {/* play overlay on hover */}
              <div className="slot-card__play" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(255,255,255,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.32)' }}>
                  <PlayIcon size={22} />
                </span>
              </div>
            </div>
            <div style={{ padding: '13px 15px 15px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px',
              }}>
                {cleanGameName(g.name)}
              </span>
              <span style={{
                marginTop: 'auto', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '11.5px', fontWeight: 700, color: 'var(--green)', background: 'rgba(10,95,62,0.09)',
                padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.02em',
              }}>
                <PlayIcon size={10} /> Gratis demo
              </span>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && !expanded && (
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              display: 'inline-block', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '12px 28px', fontSize: '15px', fontWeight: 700, color: 'var(--text)',
              background: 'var(--bg-card)', cursor: 'pointer',
            }}
          >
            {moreLabel} ({games.length - initialCount})
          </button>
        </div>
      )}
    </div>
  )
}
