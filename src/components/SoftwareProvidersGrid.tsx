import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/Icon'

interface SoftwareProvider {
  _id: string
  name: string
  slug: { current: string }
  rtp?: string | null
  amountOfSlots?: string | null
  gameCategories?: string | null
  logo?: { url: string; alt?: string } | null
}

function StatRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
      <Icon name={icon} size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  )
}

export function SoftwareProvidersGrid({
  providers,
  hrefPrefix = '/online-casino/software',
}: {
  providers: SoftwareProvider[]
  hrefPrefix?: string
}) {
  if (!providers.length) return null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
      gap: '18px',
    }}>
      {providers.map((provider) => (
        <div key={provider._id} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Logo */}
          <div style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            minHeight: '110px',
            borderBottom: '1px solid var(--border)',
          }}>
            {provider.logo?.url ? (
              <Image
                src={provider.logo.url}
                alt={provider.logo.alt || provider.name}
                width={130}
                height={65}
                style={{ objectFit: 'contain', maxHeight: '65px', width: 'auto', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', textAlign: 'center' }}>
                {provider.name}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', lineHeight: 1.3 }}>
              {provider.name}
            </div>

            <div style={{ flex: 1, marginBottom: '12px' }}>
              <StatRow icon="chart-2"  label="RTP"             value={provider.rtp} />
              <StatRow icon="play-circle" label="Antal slots" value={provider.amountOfSlots} />
              <StatRow icon="gamepad"  label="Spilkategorier" value={provider.gameCategories} />
            </div>

            <Link
              href={`${hrefPrefix}/${provider.slug.current}/`}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '9px 14px',
                border: '2px solid var(--green)',
                borderRadius: '8px',
                color: 'var(--green)',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
LÆS ANMELDELSE
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
