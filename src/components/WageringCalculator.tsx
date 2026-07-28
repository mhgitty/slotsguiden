'use client'
import { useState } from 'react'
import { Icon } from '@/components/Icon'

interface WageringCalculatorProps {
  value: {
    heading?: string
    currency?: string
    defaultDeposit?: number
    defaultBonusPercent?: number
    defaultWagering?: number
    defaultIncludeDeposit?: boolean
    defaultContribution?: number
  }
}

function num(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function fmt(n: number, currency: string): string {
  if (!Number.isFinite(n)) return `${currency}0`
  return `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--text)',
  background: '#fff',
  border: '1px solid var(--border-faint)',
  borderRadius: '8px',
  outline: 'none',
  fontFamily: 'inherit',
}

export function WageringCalculator({ value }: WageringCalculatorProps) {
  const {
    heading,
    currency = 'kr',
    defaultDeposit = 100,
    defaultBonusPercent = 100,
    defaultWagering = 35,
    defaultIncludeDeposit = false,
    defaultContribution = 100,
  } = value || {}

  const [deposit, setDeposit] = useState(String(defaultDeposit ?? 100))
  const [bonusPct, setBonusPct] = useState(String(defaultBonusPercent ?? 100))
  const [wagering, setWagering] = useState(String(defaultWagering ?? 35))
  const [includeDeposit, setIncludeDeposit] = useState(Boolean(defaultIncludeDeposit))
  const [contribution, setContribution] = useState(String(defaultContribution ?? 100))

  const d = num(deposit)
  const b = num(bonusPct)
  const w = num(wagering)
  const c = num(contribution)

  const bonusAmount = d * (b / 100)
  const totalBalance = d + bonusAmount
  const base = includeDeposit ? totalBalance : bonusAmount
  // Spilbidrag under 100% betyder, at du skal omsætte proportionalt mere.
  const wagerAmount = c > 0 ? (base * w) / (c / 100) : 0

  const results = [
    { label: 'Din indbetaling', value: fmt(d, currency) },
    { label: 'Tildelt bonusbeløb', value: fmt(bonusAmount, currency) },
    { label: 'Samlet spillersaldo', value: fmt(totalBalance, currency) },
  ]

  return (
    <div style={{ margin: '32px 0' }}>
      {heading && (
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>
          {heading}
        </h2>
      )}

      <div
        className="wcalc"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Indtastning */}
        <div className="wcalc-inputs" style={{ padding: '22px 24px' }}>
          <div className="wcalc-fields">
            <div>
              <label style={labelStyle} htmlFor="wcalc-deposit">Indbetalingsbeløb</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '15px', fontWeight: 600, color: 'var(--text-faint)', pointerEvents: 'none',
                }}>{currency}</span>
                <input
                  id="wcalc-deposit"
                  type="number" inputMode="decimal" min="0"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: `${18 + currency.length * 8}px` }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="wcalc-bonus">Bonusbeløb (%)</label>
              <input
                id="wcalc-bonus"
                type="number" inputMode="decimal" min="0"
                value={bonusPct}
                onChange={(e) => setBonusPct(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="wcalc-wagering">Gennemspilskrav (x)</label>
              <input
                id="wcalc-wagering"
                type="number" inputMode="decimal" min="0"
                value={wagering}
                onChange={(e) => setWagering(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="wcalc-contribution">Spilbidrag (%)</label>
              <input
                id="wcalc-contribution"
                type="number" inputMode="decimal" min="0" max="100"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Skifteknap */}
          <button
            type="button"
            onClick={() => setIncludeDeposit((v) => !v)}
            aria-pressed={includeDeposit}
            style={{
              marginTop: '18px',
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', textAlign: 'left',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-faint)',
              borderRadius: '10px',
              padding: '12px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: '44px', height: '24px', borderRadius: '999px',
                background: includeDeposit ? 'var(--green)' : '#CBD5E1',
                position: 'relative',
                transition: 'background 0.18s ease',
              }}
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: includeDeposit ? '23px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.18s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              }} />
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>
              {includeDeposit
                ? 'Gennemspilskravet gælder bonus + indbetaling'
                : 'Gennemspilskravet gælder kun bonus'}
            </span>
          </button>
        </div>

        {/* Resultat */}
        <div
          className="wcalc-results"
          style={{
            background: 'var(--bg-raised)',
            borderTop: '1px solid var(--border-faint)',
            padding: '22px 24px',
          }}
        >
          {results.map((r) => (
            <div
              key={r.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '16px', padding: '9px 0',
                borderBottom: '1px solid var(--border-faint)',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{r.value}</span>
            </div>
          ))}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', marginTop: '14px',
            background: 'var(--green)', borderRadius: '10px', padding: '14px 16px',
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: 600, color: '#fff',
            }}>
              <Icon name="calculator" size={18} />
              Gennemspilskrav
            </span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {fmt(wagerAmount, currency)}
            </span>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Du skal omsætte <strong>{fmt(wagerAmount, currency)}</strong> i alt for at kunne udbetale gevinster
            — {fmt(base, currency)} ({includeDeposit ? 'bonus + indbetaling' : 'kun bonus'}) × {w || 0}x
            {c > 0 && c !== 100 && <> ÷ {c}% spilbidrag</>}.
          </p>
        </div>
      </div>
    </div>
  )
}
