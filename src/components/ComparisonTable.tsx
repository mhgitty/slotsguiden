import { BonusGridCard, type GridBonus } from './BonusGridCard'
import { CasinoComparisonTable } from './CasinoComparisonTable'
import { BonusRow } from './bonus/BonusRow'
import { ShowMore } from './ShowMore'
import { slotMatcher } from '@/lib/slotMatch'

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

// Campaigns whose end date has passed are left out of lists automatically.
const live = (b: any) => !b?.kampagneSlut || new Date(b.kampagneSlut).getTime() >= Date.now()

export async function ComparisonTable({ data }: { data?: ComparisonTableData | null }) {
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
    const all = (data.bonuses || []).filter(live).map(toGridBonus)
    if (!all.length) return null
    return (
      <div id="sammenligning" className="scroll-anchor">
        <ShowMore
          items={all.map((b) => <BonusGridCard key={b._id} bonus={b} />)}
          limit={limit}
          label={data.moreButtonLabel?.trim() || 'Se flere free spins'}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', alignItems: 'stretch' }}
        />
      </div>
    )
  }

  // ── Bonus / campaign list ───────────────────────────────────────────────────
  const items = (data.bonuses || []).filter(live)
  if (!items.length) return null
  const match = await slotMatcher()
  return (
    <div id="sammenligning" className="scroll-anchor">
      <ShowMore
        className="br-list"
        items={items.map((b: any, i: number) => (
          <BonusRow key={b._id} b={b} rank={i + 1} slot={match(b.oddsBonusTitel || b.title)} />
        ))}
        limit={limit}
        label={moreLabel}
      />
    </div>
  )
}
