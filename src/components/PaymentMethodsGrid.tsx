import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/Icon'

interface PaymentMethod {
  _id: string
  name: string
  slug: { current: string }
  transactionFees?: string | null
  withdrawalTime?: string | null
  eligibleForBonuses?: string | null
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

export function PaymentMethodsGrid({
  methods,
  hrefPrefix = '/betalingsmetoder',
}: {
  methods: PaymentMethod[]
  hrefPrefix?: string
}) {
  if (!methods.length) return null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
      gap: '18px',
    }}>
      {methods.map((method) => (
        <div key={method._id} style={{
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
            {method.logo?.url ? (
              <Image
                src={method.logo.url}
                alt={method.logo.alt || method.name}
                width={130}
                height={65}
                style={{ objectFit: 'contain', maxHeight: '65px', width: 'auto', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', textAlign: 'center' }}>
                {method.name}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', lineHeight: 1.3 }}>
              {method.name}
            </div>

            <div style={{ flex: 1, marginBottom: '12px' }}>
              <StatRow icon="card"         label="Transaktionsgebyrer"   value={method.transactionFees} />
              <StatRow icon="clock-circle" label="Udbetalingstid"    value={method.withdrawalTime} />
              <StatRow icon="gift"         label="Berettiget til bonus" value={method.eligibleForBonuses} />
            </div>

            <Link
              href={`${hrefPrefix}/${method.slug.current}/`}
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
