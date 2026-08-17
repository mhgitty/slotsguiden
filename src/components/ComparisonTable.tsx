'use client'

import { useState } from 'react'
import { BonusCard } from './BonusCard'
import { CasinoComparisonTable } from './CasinoComparisonTable'
import { Icon } from './Icon'

// Data comes from the comparisonTableTemplate document (expanded by the query)
interface ComparisonTableData {
  tableType?: 'bonus' | 'bookmaker'
  bonuses?: any[]
  bookmakers?: any[]
  showMoreButton?: boolean
  visibleCount?: number
}

interface ComparisonTableProps {
  data?: ComparisonTableData | null
}

const MORE_LABEL = 'Se flere casinoer'

export function ComparisonTable({ data }: ComparisonTableProps) {
  const [expanded, setExpanded] = useState(false)
  if (!data) return null

  const limit = data.showMoreButton && data.visibleCount && data.visibleCount > 0 ? data.visibleCount : undefined

  // ── Bookmaker list ──────────────────────────────────────────────────────────
  if (data.tableType === 'bookmaker') {
    const items = data.bookmakers || []
    if (!items.length) return null
    return <CasinoComparisonTable casinos={items} maxVisible={limit} moreLabel={MORE_LABEL} />
  }

  // ── Bonus list ──────────────────────────────────────────────────────────────
  const items = data.bonuses || []
  if (!items.length) return null
  const visible = expanded || !limit ? items : items.slice(0, limit)
  const hidden = items.length - visible.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            {MORE_LABEL} ({hidden}) <Icon name="alt-arrow-down" size={16} color="var(--green)" />
          </button>
        </div>
      )}
    </div>
  )
}
