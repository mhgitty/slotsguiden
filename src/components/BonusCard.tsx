import Link from 'next/link'
import { Icon } from './Icon'
import { LogoStack, ScoreBadge, LABEL, type LogoRef } from './CasinoComparisonTable'

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
  casinoLogo?: { url?: string; alt?: string }
  casinoLogoSquare?: { url?: string; alt?: string }
  kampagneBillede?: { url?: string; alt?: string }
  bookmaker?: {
    name: string
    slug?: { current: string }
    score?: number
    logoSquare?: { url?: string; alt?: string }
    logo?: { url?: string; alt?: string }
    paymentMethods?: LogoRef[]
    software?: LogoRef[]
  }
  rank?: number
}

const DEFAULT_TERMS =
  'Alle bonusser og kampagner er underlagt vilkår, herunder gennemspilskrav, berettigelsesbegrænsninger og udløbsdatoer. Læs de fuldstændige vilkår på casinoets hjemmeside, før du gør krav på dem. 18+ | Spil ansvarligt.'

export function BonusCard({
  title,
  oddsBonusTitel, minimumOdds, minimumIndbetaling, gennemspilskrav,
  offerUrl, terms, casinoNavn,
  casinoLogo, casinoLogoSquare, kampagneBillede, bookmaker,
  rank,
}: BonusCardProps) {
  const bonusTitle = oddsBonusTitel || title
  const displayName = casinoNavn || bookmaker?.name || title
  const score = bookmaker?.score

  // Square logo preferred (bonus → casino), then wide logo, then campaign image.
  const square = casinoLogoSquare?.url ? casinoLogoSquare : (bookmaker?.logoSquare?.url ? bookmaker.logoSquare : null)
  const wide = casinoLogo?.url ? casinoLogo : (bookmaker?.logo?.url ? bookmaker.logo : kampagneBillede)
  const logo = square || wide
  const isSquare = !!square

  const reviewHref = bookmaker?.slug?.current ? `/online-casino/${bookmaker.slug.current}/` : null
  const paymentMethods = bookmaker?.paymentMethods || []
  const software = bookmaker?.software || []
  const hasStats = minimumIndbetaling != null || !!gennemspilskrav || !!minimumOdds
  const shownTerms = terms || DEFAULT_TERMS

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px 20px 14px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      {/* Rank badge — top-left corner */}
      {rank != null && (
        <div style={{
          position: 'absolute', top: '-12px', left: '14px', zIndex: 2,
          minWidth: '26px', height: '26px', padding: '0 7px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: rank === 1 ? 'var(--gold)' : 'var(--green)',
          color: rank === 1 ? '#1a1a1a' : '#fff',
          fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800,
          borderRadius: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}>
          {rank}
        </div>
      )}

      {/* Row 1 — same column tracks as the casino comparison rows */}
      <div className="casino-cmp-r1" style={{
        display: 'grid',
        gridTemplateColumns: '288px 172px minmax(0, 1fr) 190px',
        gridTemplateAreas: '"brand stats bonus cta"',
        alignItems: 'center', gap: '20px',
      }}>
        {/* Brand: logo + rating + name */}
        <div className="casino-cmp-brand" style={{ gridArea: 'brand', display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '72px' }}>
            {logo?.url ? (
              isSquare ? (
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.url} alt={logo.alt || displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.url} alt={logo.alt || displayName} style={{ maxWidth: '100%', maxHeight: '64px', objectFit: 'contain', display: 'block', borderRadius: '8px' }} />
              )
            ) : (
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>{displayName}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', minWidth: 0 }}>
            {score != null && <ScoreBadge score={score} />}
            {reviewHref ? (
              <Link href={reviewHref} style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </Link>
            ) : (
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="casino-cmp-ministats" style={{
          gridArea: 'stats',
          display: 'flex', flexDirection: 'column', gap: '10px',
          ...(hasStats ? { borderLeft: '1px solid var(--border-faint)', borderRight: '1px solid var(--border-faint)', padding: '0 16px' } : {}),
        }}>
          {minimumIndbetaling != null && (
            <div>
              <div style={{ ...LABEL, marginBottom: '2px' }}>Min. indbetaling</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{minimumIndbetaling} kr.</div>
            </div>
          )}
          {gennemspilskrav && (
            <div>
              <div style={{ ...LABEL, marginBottom: '2px' }}>Omsætningskrav</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{gennemspilskrav}</div>
            </div>
          )}
          {minimumOdds && (
            <div>
              <div style={{ ...LABEL, marginBottom: '2px' }}>Min. odds</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{minimumOdds}</div>
            </div>
          )}
        </div>

        {/* Bonus */}
        <div className="casino-cmp-bonus" style={{ gridArea: 'bonus', minWidth: 0 }}>
          {bonusTitle && (
            <>
              <div style={{ ...LABEL, marginBottom: '3px' }}>Bonus</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, overflowWrap: 'anywhere' }}>
                {bonusTitle}
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="casino-cmp-cta" style={{ gridArea: 'cta', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
          {offerUrl && (
            <a href={offerUrl} target="_blank" rel="nofollow noopener noreferrer sponsored" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: 'var(--btn)', color: '#fff', padding: '13px 24px', borderRadius: '9px',
              fontSize: '16px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              Hent bonus <Icon name="arrow-right" size={18} color="#fff" />
            </a>
          )}
          {reviewHref && (
            <Link href={reviewHref} style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Læs casinoanmeldelse
            </Link>
          )}
        </div>
      </div>

      {/* Row 2 — terms · payments · software */}
      <div className="casino-cmp-r2" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 165px 165px',
        gridTemplateAreas: '"terms payments software"',
        alignItems: 'center', columnGap: '18px', rowGap: '14px',
        marginTop: '12px', paddingTop: '11px', borderTop: '1px solid var(--border-faint)',
      }}>
        <div className="casino-cmp-terms" style={{ gridArea: 'terms', minWidth: 0, fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.45 }}>
          {shownTerms}
        </div>
        <div style={{ gridArea: 'payments', minWidth: 0 }}>
          <LogoStack label="Betalingsmetoder" items={paymentMethods} />
        </div>
        <div style={{ gridArea: 'software', minWidth: 0 }}>
          <LogoStack label="Spiludviklere" items={software} />
        </div>
      </div>
    </div>
  )
}
