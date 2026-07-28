'use client'
import { useState } from 'react'
import { Icon } from '@/components/Icon'

interface CashbackCalculatorProps {
  value: {
    heading?: string
    currency?: string
    defaultNetLoss?: number
    defaultPercent?: number
    defaultCap?: number
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

export function CashbackCalculator({ value }: CashbackCalculatorProps) {
  const {
    heading,
    currency = 'kr',
    defaultNetLoss = 500,
    defaultPercent = 10,
    defaultCap = 0,
  } = value || {}

  const [netLoss, setNetLoss] = useState(String(defaultNetLoss ?? 500))
  const [percent, setPercent] = useState(String(defaultPercent ?? 10))
  const [cap, setCap] = useState(defaultCap ? String(defaultCap) : '')

  const loss = num(netLoss)
  const pct = num(percent)
  const capValue = cap.trim() === '' ? 0 : num(cap)

  const raw = loss * (pct / 100)
  const capped = capValue > 0 && raw > capValue
  const cashback = capped ? capValue : raw

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
        <div className="wcalc-inputs" style={{ padding: '22px 24px' }}>
          <div className="ccalc-fields">
            <div>
              <label style={labelStyle} htmlFor="ccalc-loss">Nettotab</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '15px', fontWeight: 600, color: 'var(--text-faint)', pointerEvents: 'none',
                }}>{currency}</span>
                <input
                  id="ccalc-loss"
                  type="number" inputMode="decimal" min="0"
                  value={netLoss}
                  onChange={(e) => setNetLoss(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: `${18 + currency.length * 8}px` }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="ccalc-pct">Cashback-procent (%)</label>
              <input
                id="ccalc-pct"
                type="number" inputMode="decimal" min="0" max="100"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="ccalc-cap">Cashback-loft (valgfrit)</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '15px', fontWeight: 600, color: 'var(--text-faint)', pointerEvents: 'none',
                }}>{currency}</span>
                <input
                  id="ccalc-cap"
                  type="number" inputMode="decimal" min="0"
                  value={cap}
                  placeholder="Intet loft"
                  onChange={(e) => setCap(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: `${18 + currency.length * 8}px` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="wcalc-results"
          style={{
            background: 'var(--bg-raised)',
            borderTop: '1px solid var(--border-faint)',
            padding: '22px 24px',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px',
            background: 'var(--btn)', borderRadius: '10px', padding: '14px 16px',
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: 600, color: '#fff',
            }}>
              <Icon name="wad-of-money" size={18} />
              Total cashback
            </span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {fmt(cashback, currency)}
            </span>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {pct || 0}% af {fmt(loss, currency)} = <strong>{fmt(raw, currency)}</strong>
            {capped && <> — reduceret til {fmt(capValue, currency)} af cashback-loftet</>}.
          </p>
        </div>
      </div>
    </div>
  )
}
