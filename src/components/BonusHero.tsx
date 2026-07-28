'use client'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { Breadcrumbs } from './Breadcrumbs'

interface BonusHeroProps {
  title: string
  casinoNavn?: string | null
  logoUrl?: string | null
  logoAlt?: string | null
  offerUrl?: string | null
  terms?: string | null
  minimumOdds?: string | null
  minimumIndbetaling?: number | null
  gennemspilskrav?: string | null
  maksGevinst?: string | null
  bonuskode?: string | null
  spinVaerdi?: string | null
  bonusListHref?: string
}


function StatBox({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) {
  const empty = !value
  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: `1px solid var(--border)`,
      borderRadius: '10px', padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: '10px',
      minWidth: 0, opacity: empty ? 0.4 : 1,
    }}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '1px' }}>
          {label}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
          {value ?? '—'}
        </div>
      </div>
    </div>
  )
}

export function BonusHero({
  title, casinoNavn, logoUrl, logoAlt, offerUrl, terms,
  minimumOdds, minimumIndbetaling, gennemspilskrav,
  maksGevinst, bonuskode, spinVaerdi, bonusListHref = '/',
}: BonusHeroProps) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    if (!bonuskode) return
    navigator.clipboard.writeText(bonuskode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="hero-section" style={{
      background: 'var(--bg-hero)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: '1250px', margin: '0 auto' }}>

        <Breadcrumbs crumbs={[{ label: 'Hjem', href: '/' }, { label: 'Bonusser', href: bonusListHref }, { label: title }]} />

        {/* Logo + title */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '28px' }}>
          {logoUrl && (
            <div style={{ flexShrink: 0, width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={logoUrl} alt={logoAlt || casinoNavn || title} style={{ width: '72px', height: '72px', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div>
            {casinoNavn && (
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                {casinoNavn}
              </div>
            )}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3.5vw, 38px)',
              fontWeight: 800, color: 'var(--text)',
              lineHeight: 1.2, letterSpacing: '-0.03em', margin: 0,
            }}>
              {title}
            </h1>
          </div>
        </div>

        {/* Stat grid — 2 cols mobile, 3 cols desktop */}
        <div className="bonus-stats-grid">

          <StatBox label="Min. odds" value={minimumOdds ?? null} icon={

            <Icon name="chart-2" size={22} color={minimumOdds ? 'var(--green)' : 'var(--text-faint)'} style={{ flexShrink: 0 }} />
          } />

          <StatBox label="Min. indbetaling" value={minimumIndbetaling != null ? `${minimumIndbetaling} kr.` : null} icon={
            <Icon name="card-2" size={22} color={minimumIndbetaling != null ? 'var(--green)' : 'var(--text-faint)'} style={{ flexShrink: 0 }} />
          } />

          <StatBox label="Gennemspilskrav" value={gennemspilskrav ?? null} icon={
            <Icon name="refresh-circle" size={22} color={gennemspilskrav ? 'var(--green)' : 'var(--text-faint)'} style={{ flexShrink: 0 }} />
          } />

          <StatBox label="Max. gevinst" value={maksGevinst ?? null} icon={
            <Icon name="cup-star" size={22} color={maksGevinst ? 'var(--green)' : 'var(--text-faint)'} style={{ flexShrink: 0 }} />
          } />

          <StatBox label="Spinværdi" value={spinVaerdi ?? null} icon={
            <Icon name="wheel" size={22} color={spinVaerdi ? 'var(--green)' : 'var(--text-faint)'} style={{ flexShrink: 0 }} />
          } />

          {/* Bonuskode — spans full width if present, otherwise a normal greyed box */}
          {bonuskode ? (
            <div style={{
              background: 'rgba(28,127,192,0.08)',
              border: '1px dashed rgba(28,127,192,0.5)',
              borderRadius: '10px', padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <Icon name="tag-price" size={22} color="var(--green)" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '1px' }}>Bonuskode</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em' }}>{bonuskode}</div>
                </div>
              </div>
              <button onClick={copyCode} style={{
                background: copied ? 'var(--green-dark)' : 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: '6px',
                padding: '5px 10px', fontSize: '11px', fontWeight: 600,
                color: copied ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
              }}>
                {copied ? '✓ Kopieret' : 'Kopiér'}
              </button>
            </div>
          ) : (
            <StatBox label="Bonuskode" value={null} icon={
              <Icon name="tag-price" size={22} color="var(--text-faint)" style={{ flexShrink: 0 }} />
            } />
          )}

        </div>

        {/* CTA — full width */}
        {offerUrl && (
          <div>
            <a
              href={offerUrl}
              target="_blank"
              rel="nofollow noopener noreferrer sponsored"
              style={{
                display: 'block', width: '100%',
                background: 'var(--btn)', color: '#fff',
                padding: '15px 28px', borderRadius: '10px',
                fontSize: '16px', fontWeight: 700,
                textDecoration: 'none', textAlign: 'center',
                letterSpacing: '-0.01em', boxSizing: 'border-box',
              }}
            >
              Hent bonus nu →
            </a>
            {terms && (
              <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '10px 0 0', lineHeight: 1.5 }}>
                {terms}
              </p>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
