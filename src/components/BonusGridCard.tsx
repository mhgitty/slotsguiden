import Image from 'next/image'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'

export interface GridBonus {
  _id: string
  title?: string
  description?: string
  offerUrl?: string
  kampagneSlut?: string
  campaignImage?: { url?: string; alt?: string; w?: number; h?: number }
  logoSquare?: { url?: string; alt?: string }
  minimumIndbetaling?: number
  spinVaerdi?: string
  gennemspilskrav?: string
  maksGevinst?: string
  terms?: string
}

function formatExpiry(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}-${d.getFullYear()}`
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderTop: '1px solid var(--border-faint)' }}>
      <Icon name={icon} size={18} color="var(--green)" />
      <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', marginLeft: 'auto' }}>{value}</span>
    </div>
  )
}

export function BonusGridCard({ bonus, label = 'Free spins til eksisterende kunder' }: { bonus: GridBonus; label?: string }) {
  const expiry = formatExpiry(bonus.kampagneSlut)
  const hasStats = bonus.minimumIndbetaling != null || bonus.spinVaerdi || bonus.gennemspilskrav || bonus.maksGevinst

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-card)' }}>
      {/* Campaign image — full image at natural height (not cropped), links to offer */}
      {bonus.campaignImage?.url && bonus.campaignImage.w && bonus.campaignImage.h && (
        <a href={bonus.offerUrl || '#'} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'block' }}>
          <Image
            src={bonus.campaignImage.url}
            alt={bonus.campaignImage.alt ?? bonus.title ?? ''}
            width={bonus.campaignImage.w}
            height={bonus.campaignImage.h}
            sizes="(max-width: 768px) 100vw, 400px"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </a>
      )}

      <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {bonus.logoSquare?.url && (
            <a href={bonus.offerUrl || '#'} target="_blank" rel="nofollow sponsored noopener" style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', display: 'block' }}>
              <Image src={bonus.logoSquare.url} alt={bonus.logoSquare.alt ?? bonus.title ?? ''} fill style={{ objectFit: 'cover' }} sizes="48px" />
            </a>
          )}
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, margin: 0 }}>
            {bonus.title}
          </h3>
        </div>

        {/* Category bar */}
        {label && (
          <div style={{ background: 'var(--green)', color: '#fff', fontSize: '13px', fontWeight: 600, textAlign: 'center', padding: '8px 12px', borderRadius: '7px', marginTop: '14px' }}>
            {label}
          </div>
        )}

        {/* Description */}
        {bonus.description && (
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '14px 0 0' }}>{bonus.description}</p>
        )}

        {/* Expiry */}
        {expiry && (
          <div style={{ fontSize: '13px', color: 'var(--text-faint)', marginTop: '16px' }}>Udløber d. {expiry}</div>
        )}

        {/* CTA */}
        <a
          href={bonus.offerUrl || '#'}
          target="_blank"
          rel="nofollow sponsored noopener"
          style={{ display: 'block', textAlign: 'center', background: 'var(--btn)', color: '#fff', fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.02em', padding: '14px', borderRadius: '8px', textDecoration: 'none', marginTop: '12px' }}
        >
          Få bonus nu
        </a>

        {/* Bonus info dropdown (native, no JS) */}
        {hasStats && (
          <details style={{ marginTop: '10px' }}>
            <summary style={{ listStyle: 'none', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--btn)', color: 'var(--text)', fontWeight: 600, fontSize: '14px', padding: '12px', borderRadius: '8px' }}>
              Bonus info
            </summary>
            <div style={{ marginTop: '12px' }}>
              {bonus.minimumIndbetaling != null && <InfoRow icon="wallet" label="Indbetalingskrav" value={`${bonus.minimumIndbetaling} kr.`} />}
              {bonus.spinVaerdi && <InfoRow icon="refresh" label="Spin værdi" value={bonus.spinVaerdi} />}
              {bonus.gennemspilskrav && <InfoRow icon="refresh-circle" label="Gennemspilskrav" value={bonus.gennemspilskrav} />}
              {bonus.maksGevinst && <InfoRow icon="cup-star" label="Max gevinst" value={bonus.maksGevinst} />}
            </div>
          </details>
        )}

        {/* Terms — always visible */}
        {bonus.terms && (
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.55, marginTop: '14px' }}><Terms html={bonus.terms} /></p>
        )}
      </div>
    </div>
  )
}
