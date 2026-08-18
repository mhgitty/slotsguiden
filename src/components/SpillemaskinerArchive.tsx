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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
        {visible.map((g) => (
          <Link key={g._id} href={`/online-spillemaskiner/${g.slug}/`}
            style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-card)', textDecoration: 'none' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'var(--bg-raised)' }}>
              {g.featuredImage?.url && (
                <Image src={g.featuredImage.url} alt={g.featuredImage.alt ?? g.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 300px" />
              )}
            </div>
            <div style={{ padding: '14px 16px 16px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '15.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{g.name}</span>
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
