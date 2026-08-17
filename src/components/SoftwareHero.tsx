import Image from 'next/image'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: '1 1 140px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '16px 20px',
      background: 'rgba(10,95,62,0.07)',
      border: '1px solid rgba(10,95,62,0.15)',
      borderRadius: '12px',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {label}
      </span>
      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
        {value}
      </span>
    </div>
  )
}

interface SoftwareHeroProps {
  name: string
  titel?: string | null
  logo?: { url: string; alt?: string } | null
  rtp?: string | null
  amountOfSlots?: string | null
  licenses?: string | null
  gameCategories?: string | null
  highestRtpSlot?: string | null
  bonusBuys?: string | null
  intro?: any[] | null
}

export function SoftwareHero({
  name,
  titel,
  logo,
  rtp,
  amountOfSlots,
  licenses,
  gameCategories,
  highestRtpSlot,
  bonusBuys,
  intro,
}: SoftwareHeroProps) {
  const title = titel || name

  const stats: { label: string; value: string | null | undefined }[] = [
    { label: 'RTP',              value: rtp },
    { label: 'Antal slots',  value: amountOfSlots },
    { label: 'Licenser',         value: licenses },
    { label: 'Spilkategorier',  value: gameCategories },
    { label: 'Slot med højest RTP', value: highestRtpSlot },
    { label: 'Bonus Buys',       value: bonusBuys },
  ]

  const activeStats = stats.filter((s) => s.value)

  return (
    <div style={{
      background: 'var(--bg-hero)',
      borderBottom: '1px solid var(--border)',
      padding: '16px 15px 36px',
    }}>
      <div style={{ maxWidth: '1250px', margin: '0 auto' }}>

        {/* Card */}
        <div className="dochero-card">

          {/* Logo */}
          {logo?.url && (
            <div className="dochero-logo" style={{
              width: '100px',
              height: '100px',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <Image
                src={logo.url}
                alt={logo.alt || name}
                width={76}
                height={76}
                style={{ objectFit: 'contain', maxWidth: '76px', maxHeight: '76px' }}
              />
            </div>
          )}

          {/* Title: eyebrow + H1 */}
          <div className="dochero-titles">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(10,95,62,0.1)', color: 'var(--green)',
              fontSize: '11px', fontWeight: 700,
              padding: '3px 10px', borderRadius: '20px',
              marginBottom: '10px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Spiludvikler
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3vw, 36px)',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: 0,
            }}>
              {title}
            </h1>
          </div>

          {/* Body: intro + stats (full width) */}
          {(intro?.length || activeStats.length > 0) && (
            <div className="dochero-body">
              {intro && intro.length > 0 && (
                <div style={{ marginBottom: activeStats.length > 0 ? '20px' : '0', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7 }}>
                  <PortableTextRenderer value={intro} />
                </div>
              )}
              {activeStats.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {activeStats.map((stat) => (
                    <StatBox key={stat.label} label={stat.label} value={stat.value!} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
