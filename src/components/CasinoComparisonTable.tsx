'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from './Icon'

// ─── Types ──────────────────────────────────────────────────────────────────
export interface LogoRef {
  _id: string
  name: string
  slug?: string
  logo?: { url?: string; alt?: string }
}

interface Casino {
  _id: string
  name: string
  slug: { current: string }
  usp?: string
  score?: number
  indbetalingsbonus?: string
  minIndbetaling?: number
  gennemspilskrav?: string
  url?: string
  terms?: string
  market?: string
  logo?: { url?: string; alt?: string }
  logoSquare?: { url?: string; alt?: string }
  paymentMethods?: LogoRef[]
  software?: LogoRef[]
}

interface CasinoComparisonTableProps {
  casinos?: Casino[]
  /** Currency symbol for the minimum deposit. */
  currency?: string
  /** Advertiser disclosure shown above the table. Pass null to hide. */
  disclosure?: string | null
  /** Show only this many casinos; hide the rest behind a "show more" button. */
  maxVisible?: number
  /** Label for the show-more button. */
  moreLabel?: string
}

const DEFAULT_DISCLOSURE = 'Vi kan modtage provision fra disse casinoer · 18+ · Spil ansvarligt'

const DEFAULT_TERMS =
  'Alle bonusser og kampagner er underlagt vilkår, herunder gennemspilskrav, berettigelsesbegrænsninger og udløbsdatoer. Læs de fuldstændige vilkår på casinoets hjemmeside, før du gør krav på dem. 18+ | Spil ansvarligt.'

export const LABEL: React.CSSProperties = {
  fontSize: '12px', color: 'var(--text-faint)', textTransform: 'uppercase',
  letterSpacing: '0.5px', fontWeight: 600,
}

// ─── Score badge ──────────────────────────────────────────────────────────────
export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'var(--green)' : score >= 6 ? '#ca8a04' : '#dc2626'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: color, color: '#fff',
      fontSize: '13px', fontWeight: 800, lineHeight: 1,
      padding: '5px 10px', borderRadius: '18px',
    }}>
      <Icon name="star" size={13} color="#fff" /> {score.toFixed(1)}
    </span>
  )
}

// ─── A single payment/software logo tile (rounded 10px) ──────────────────────────
function LogoTile({ item, size = 28 }: { item: LogoRef; size?: number }) {
  if (item.logo?.url) {
    return (
      <div title={item.name} style={{
        width: size, height: size, borderRadius: '10px', background: '#fff',
        border: '1px solid var(--border-faint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.logo.url} alt={item.logo.alt || item.name}
          style={{ maxWidth: '82%', maxHeight: '82%', objectFit: 'contain', display: 'block' }} />
      </div>
    )
  }
  return (
    <div title={item.name} style={{
      height: size, padding: '0 7px', borderRadius: '10px', background: 'var(--bg-raised)',
      border: '1px solid var(--border-faint)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '9.5px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap',
    }}>
      {item.name}
    </div>
  )
}

// ─── Logo stack: overlapping logos + "+N" → tooltip listing all ──────────────────
export function LogoStack({ label, items, max = 4 }: { label: string; items: LogoRef[]; max?: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!items?.length) return null
  const shown = items.slice(0, max)
  const extra = items.length - shown.length

  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ ...LABEL, fontSize: '10px', marginBottom: '6px' }}>{label}</div>
      <div
        ref={ref}
        style={{ position: 'relative', display: 'inline-flex' }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {shown.map((it, i) => (
            <div key={it._id} style={{
              marginLeft: i === 0 ? 0 : '-9px',
              borderRadius: '10px',
              boxShadow: '0 0 0 2px var(--bg-card)',
              position: 'relative',
              zIndex: shown.length - i,
            }}>
              <LogoTile item={it} size={28} />
            </div>
          ))}
          {extra > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={`Vis alle ${items.length} ${label.toLowerCase()}`}
              style={{
                height: 28, minWidth: 28, padding: '0 7px', borderRadius: '10px',
                marginLeft: '5px', background: 'var(--green-light)', border: '1px solid var(--green)',
                color: 'var(--green-dark)', fontSize: '12px', fontWeight: 800,
                cursor: 'pointer', position: 'relative', zIndex: 0,
              }}
            >
              +{extra}
            </button>
          )}
        </div>

        {open && (
          <div role="tooltip" style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, zIndex: 30,
            minWidth: '190px', maxWidth: '270px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '10px', boxShadow: '0 12px 32px rgba(0,0,0,0.16)', padding: '9px',
          }}>
            <div style={{ ...LABEL, fontSize: '9.5px', fontWeight: 700, marginBottom: '7px' }}>
              {label} · {items.length}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {items.map((it) => (
                <div key={it._id} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: 'var(--bg-raised)', border: '1px solid var(--border-faint)',
                  borderRadius: '7px', padding: '3px 8px 3px 4px',
                }}>
                  <LogoTile item={it} size={18} />
                  <span style={{ fontSize: '11.5px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{it.name}</span>
                </div>
              ))}
            </div>
            <div style={{
              position: 'absolute', top: '100%', right: '14px', width: 0, height: 0,
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
              borderTop: '6px solid var(--border)',
            }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── One casino row ─────────────────────────────────────────────────────────────
function CasinoRow({ casino, currency, rank }: { casino: Casino; currency: string; rank?: number }) {
  // All casinos live under /online-casino/.
  const reviewHref = `/online-casino/${casino.slug.current}/`
  const hasStats = casino.minIndbetaling != null || !!casino.gennemspilskrav
  const terms = casino.terms || DEFAULT_TERMS

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

      {casino.usp && (
        <span style={{
          position: 'absolute', top: '-11px', left: '52px',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: 'var(--btn)', color: '#fff',
          fontSize: '11.5px', fontWeight: 600, lineHeight: 1.3,
          padding: '3px 12px', borderRadius: '20px',
          maxWidth: 'calc(100% - 70px)',
        }}>
          <Icon name="cup-star" size={12} color="#fff" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{casino.usp}</span>
        </span>
      )}

      {/* Row 1 — fixed column tracks so the bonus column aligns across every row */}
      <div className="casino-cmp-r1" style={{
        display: 'grid',
        gridTemplateColumns: '288px 172px minmax(0, 1fr) 190px',
        gridTemplateAreas: '"brand stats bonus cta"',
        alignItems: 'center', gap: '20px',
      }}>
        {/* logo + rating + name grouped together */}
        <div className="casino-cmp-brand" style={{ gridArea: 'brand', display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          {/* logo — square version preferred */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '72px' }}>
            {casino.logoSquare?.url ? (
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={casino.logoSquare.url} alt={casino.logoSquare.alt || casino.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : casino.logo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={casino.logo.url} alt={casino.logo.alt || casino.name}
                style={{ maxWidth: '100%', maxHeight: '64px', objectFit: 'contain', display: 'block', borderRadius: '8px' }} />
            ) : (
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>{casino.name}</span>
            )}
          </div>

          {/* rating + name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', minWidth: 0 }}>
            {casino.score != null && <ScoreBadge score={casino.score} />}
            <Link href={reviewHref} style={{
              fontSize: '20px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none',
              whiteSpace: 'nowrap', fontFamily: 'var(--font-display)',
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {casino.name}
            </Link>
          </div>
        </div>

        {/* min dep / wager — always occupies its column so rows align */}
        <div className="casino-cmp-ministats" style={{
          gridArea: 'stats',
          display: 'flex', flexDirection: 'column', gap: '10px',
          ...(hasStats ? { borderLeft: '1px solid var(--border-faint)', borderRight: '1px solid var(--border-faint)', padding: '0 16px' } : {}),
        }}>
          {casino.minIndbetaling != null && (
            <div>
              <div style={{ ...LABEL, marginBottom: '2px' }}>Min. indbetaling</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{casino.minIndbetaling} {currency}</div>
            </div>
          )}
          {casino.gennemspilskrav && (
            <div>
              <div style={{ ...LABEL, marginBottom: '2px' }}>Omsætningskrav</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{casino.gennemspilskrav}</div>
            </div>
          )}
        </div>

        {/* welcome bonus — always occupies its column */}
        <div className="casino-cmp-bonus" style={{ gridArea: 'bonus', minWidth: 0 }}>
          {casino.indbetalingsbonus && (
            <>
              <div style={{ ...LABEL, marginBottom: '3px' }}>Velkomstbonus</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, overflowWrap: 'anywhere' }}>
                {casino.indbetalingsbonus}
              </div>
            </>
          )}
        </div>

        <div className="casino-cmp-cta" style={{
          gridArea: 'cta',
          display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px',
        }}>
          {casino.url && (
            <a href={casino.url} target="_blank" rel="nofollow noopener noreferrer sponsored" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: 'var(--btn)', color: '#fff',
              padding: '13px 24px', borderRadius: '9px',
              fontSize: '16px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              Hent bonus <Icon name="arrow-right" size={18} color="#fff" />
            </a>
          )}
          <Link href={reviewHref} style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
            Læs casinoanmeldelse
          </Link>
        </div>
      </div>

      {/* Row 2 — terms · payments · software (fixed payment/software tracks so they align across rows) */}
      <div className="casino-cmp-r2" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 165px 165px',
        gridTemplateAreas: '"terms payments software"',
        alignItems: 'center', columnGap: '18px', rowGap: '14px',
        marginTop: '12px', paddingTop: '11px', borderTop: '1px solid var(--border-faint)',
      }}>
        <div className="casino-cmp-terms" style={{ gridArea: 'terms', minWidth: 0, fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.45 }}>
          {terms}
        </div>
        <div style={{ gridArea: 'payments', minWidth: 0 }}>
          <LogoStack label="Betalingsmetoder" items={casino.paymentMethods || []} />
        </div>
        <div style={{ gridArea: 'software', minWidth: 0 }}>
          <LogoStack label="Spiludviklere" items={casino.software || []} />
        </div>
      </div>
    </div>
  )
}

// ─── Table ──────────────────────────────────────────────────────────────────────
export function CasinoComparisonTable({ casinos, currency = 'kr.', disclosure = DEFAULT_DISCLOSURE, maxVisible, moreLabel = 'Se flere casinoer' }: CasinoComparisonTableProps) {
  const [expanded, setExpanded] = useState(false)
  if (!casinos?.length) return null

  const limit = maxVisible && maxVisible > 0 ? maxVisible : casinos.length
  const visible = expanded ? casinos : casinos.slice(0, limit)
  const hidden = casinos.length - visible.length

  return (
    <div>
      {disclosure && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px',
          fontSize: '11px', color: 'var(--text-faint)', marginBottom: '14px',
        }}>
          <span style={{
            background: 'var(--bg-raised)', border: '1px solid var(--border-faint)', color: 'var(--text-muted)',
            fontWeight: 700, fontSize: '9.5px', letterSpacing: '0.5px', padding: '2px 6px',
            borderRadius: '5px', textTransform: 'uppercase',
          }}>
            Annonce
          </span>
          {disclosure}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {visible.map((c, i) => (
          <CasinoRow key={c._id} casino={c} currency={currency} rank={i + 1} />
        ))}
      </div>
      {hidden > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '22px' }}>
          <button
            onClick={() => setExpanded(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--btn)',
              color: 'var(--green-dark)', fontWeight: 700, fontSize: '15px',
              padding: '13px 30px', borderRadius: '10px', cursor: 'pointer',
            }}
          >
            {moreLabel} ({hidden}) <Icon name="alt-arrow-down" size={16} color="var(--green)" />
          </button>
        </div>
      )}
    </div>
  )
}
