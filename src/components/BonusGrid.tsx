import { getFreeSpinsGridBonuses } from '@/lib/sanity'
import { BonusGridCard, type GridBonus } from '@/components/BonusGridCard'

export async function BonusGrid({ title, label }: { title?: string; label?: string }) {
  const bonuses: GridBonus[] = await getFreeSpinsGridBonuses().catch(() => [])
  if (!bonuses.length) return null

  return (
    <section className="section" style={{ paddingTop: '8px' }}>
      {title && (
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
          {title}
        </h2>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
        {bonuses.map((b) => (
          <BonusGridCard key={b._id} bonus={b} {...(label ? { label } : {})} />
        ))}
      </div>
    </section>
  )
}
