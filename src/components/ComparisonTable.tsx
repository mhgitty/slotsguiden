'use client'

import { useState } from 'react'
import { BonusCard } from './BonusCard'
import { BonusGridCard, type GridBonus } from './BonusGridCard'
import { CasinoComparisonTable } from './CasinoComparisonTable'
import { Icon } from './Icon'

// Data comes from the comparisonTableTemplate document (expanded by the query)
interface ComparisonTableData {
  tableType?: 'bonus' | 'bookmaker' | 'freeSpinsEksisterende'
  bonuses?: any[]
  bookmakers?: any[]
  showMoreButton?: boolean
  visibleCount?: number
  moreButtonLabel?: string
}

/** Map a projected bonus into the free-spins grid card shape. */
function toGridBonus(b: any): GridBonus {
  return {
    _id: b._id,
    title: b.gridTitle || b.oddsBonusTitel || b.title,
    description: b.gridDescription,
    offerUrl: b.offerUrl,
    kampagneSlut: b.kampagneSlut,
    campaignImage: b.campaignImage,
    logoSquare: b.casinoLogoSquare,
    minimumIndbetaling: b.minimumIndbetaling,
    spinVaerdi: b.spinVaerdi,
    gennemspilskrav: b.gennemspilskrav,
    maksGevinst: b.maksGevinst,
    terms: b.terms,
  }
}

interface ComparisonTableProps {
  data?: ComparisonTableData | null
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  const [expanded, setExpanded] = useState(false)
  if (!data) return null

  const limit = data.showMoreButton && data.visibleCount && data.visibleCount > 0 ? data.visibleCount : undefined
  const moreLabel = data.moreButtonLabel?.trim() || 'Se flere casinoer'

  // ── Bookmaker list ──────────────────────────────────────────────────────────
  if (data.tableType === 'bookmaker') {
    const items = data.bookmakers || []
    if (!items.length) return null
    return (
      <div id="sammenligning" className="scroll-anchor">
        <CasinoComparisonTable casinos={items} maxVisible={limit} moreLabel={moreLabel} />
      </div>
    )
  }

  // ── Free spins til eksisterende kunder (grid card design) ────────────────────
  if (data.tableType === 'freeSpinsEksisterende') {
    const all = (data.bonuses || []).map(toGridBonus)
    if (!all.length) return null
    const visible = expanded || !limit ? all : all.slice(0, limit)
    const hidden = all.length - visible.length
    const moreFsLabel = data.moreButtonLabel?.trim() || 'Se flere free spins'
    return (
      <div id="sammenligning" className="scroll-anchor">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
          {visible.map((b) => (
            <BonusGridCard key={b._id} bonus={b} />
          ))}
        </div>
        {hidden > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={() => setExpanded(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-card)', border: '1px solid var(--btn)',
                color: 'var(--green-dark)', fontWeight: 700, fontSize: '15px',
                padding: '13px 30px', borderRadius: '10px', cursor: 'pointer',
              }}
            >
              {moreFsLabel} ({hidden}) <Icon name="alt-arrow-down" size={16} color="var(--green)" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Bonus list ──────────────────────────────────────────────────────────────
  const items = data.bonuses || []
  if (!items.length) return null
  const visible = expanded || !limit ? items : items.slice(0, limit)
  const hidden = items.length - visible.length

  return (
    <div id="sammenligning" className="scroll-anchor" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {visible.map((bonus: any, i: number) => (
        <BonusCard key={bonus._id} {...bonus} rank={i + 1} />
      ))}
      {hidden > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
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
