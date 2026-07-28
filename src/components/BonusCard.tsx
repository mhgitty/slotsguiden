import Link from 'next/link'
import Image from 'next/image'

interface BonusCardProps {
  _id: string
  title: string
  slug: { current: string }
  oddsBonusTitel?: string
  minimumOdds?: string
  minimumIndbetaling?: number
  gennemspilskrav?: string
  offerUrl?: string
  terms?: string
  casinoNavn?: string
  casinoLogo?: { url: string; alt?: string }
  kampagneBillede?: { url: string; alt?: string }
  bookmaker?: { name: string; slug: { current: string } }
  rank?: number
}

export function BonusCard({
  title, slug,
  oddsBonusTitel, minimumOdds, minimumIndbetaling, gennemspilskrav,
  offerUrl, terms, casinoNavn,
  casinoLogo, kampagneBillede, bookmaker,
  rank,
}: BonusCardProps) {
  const bonusTitle = oddsBonusTitel || title

  // Banner image — prefer casino logo, fall back to campaign image
  const bannerImage = casinoLogo?.url ? casinoLogo : kampagneBillede

  // Bookmaker page link
  const reviewUrl = bookmaker?.slug?.current
    ? `/review/${bookmaker.slug.current}`
    : null

  const displayName = casinoNavn || bookmaker?.name || title

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {rank === 1 && (
        <div style={{
          position: 'absolute', top: 0, left: '20px',
          background: 'var(--gold)', color: '#111827',
          fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.5px',
          padding: '3px 12px', borderRadius: '0 0 8px 8px',
          zIndex: 1,
        }}>
          🏆 Højst rangeret
        </div>
      )}

      {/* Main card row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr auto',
        minHeight: '130px',
      }} className="bonus-card-grid">

        {/* ── Left: campaign image ── */}
        <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {bannerImage?.url ? (
            <Image
              src={bannerImage.url}
              alt={bannerImage.alt || displayName}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              sizes="260px"
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: '130px',
              background: 'var(--bg-raised)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: 'var(--text-faint)', fontWeight: 600,
              padding: '16px', textAlign: 'center',
            }}>
              {displayName}
            </div>
          )}
        </div>

        {/* ── Middle: stats + bonus title ── */}
        <div className="bonus-card-middle" style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1px 1fr',
          alignItems: 'stretch',
        }}>
          {/* Stats */}
          <div className="bonus-card-stats" style={{
            padding: '20px 28px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px',
          }}>
            <StatRow label="Gennemspilskrav" value={gennemspilskrav} />
            <StatRow label="Min. indbetaling"          value={minimumIndbetaling != null ? `${minimumIndbetaling} kr.` : undefined} />
            <StatRow label="Min. odds"             value={minimumOdds} />
          </div>

          {/* Vertical divider — hidden on mobile */}
          <div className="bonus-card-vdivider" style={{ background: 'var(--border)', margin: '20px 0' }} />

          {/* Bonus title */}
          <div className="bonus-card-title-cell" style={{
            padding: '20px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 2vw, 26px)',
              fontWeight: 800,
              color: 'var(--text)',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              textAlign: 'center',
              margin: 0,
            }}>
              {bonusTitle}
            </p>
          </div>
        </div>

        {/* ── Right: CTA buttons ── */}
        <div className="bonus-card-cta" style={{
          borderLeft: '1px solid var(--border)',
          padding: '20px 24px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'stretch', justifyContent: 'center',
          gap: '10px', minWidth: '190px',
        }}>
          {offerUrl && (
            <a
              href={offerUrl}
              target="_blank"
              rel="nofollow noopener noreferrer sponsored"
              style={{
                display: 'block', textAlign: 'center',
                background: 'var(--btn)',
                color: '#fff', fontWeight: 700, fontSize: '14px',
                padding: '13px 16px', borderRadius: '10px',
                textDecoration: 'none', letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
              }}
            >
HENT BONUS
            </a>
          )}
          {reviewUrl && (
            <Link
              href={reviewUrl}
              style={{
                display: 'block', textAlign: 'center',
                background: 'transparent',
                color: 'var(--green)', fontWeight: 700, fontSize: '14px',
                padding: '12px 16px', borderRadius: '10px',
                textDecoration: 'none', letterSpacing: '0.03em',
                border: '2px solid var(--green)',
                whiteSpace: 'nowrap',
              }}
            >
LÆS ANMELDELSE
            </Link>
          )}
        </div>
      </div>

      {/* Terms row */}
      {terms && (
        <div style={{
          padding: '8px 24px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.6,
        }}>
          {terms}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '24px' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}
