'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Icon } from '@/components/Icon'
import { replaceDateVars } from '@/lib/dateVars'

export interface PopupBonus {
  _id: string
  name?: string
  headline?: string
  minimumIndbetaling?: number
  gennemspilskrav?: string
  offerUrl?: string
  terms?: string
  slug?: string
  logo?: { url?: string; alt?: string }
}

const DISMISS_KEY = 'sg-popup-dismissed'
const DELAY_MS = 4000

function Stat({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      <Icon name={icon} size={16} color="var(--green)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

export function BonusPopup({ bonus }: { bonus: PopupBonus | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const inStudio = pathname?.startsWith('/studio')

  useEffect(() => {
    if (!bonus || inStudio) return
    try { if (sessionStorage.getItem(DISMISS_KEY)) return } catch { /* ignore */ }
    const t = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [bonus, inStudio])

  if (!bonus || !open || inStudio) return null

  const close = () => {
    setOpen(false)
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  const name = replaceDateVars(bonus.name || '')
  const headline = replaceDateVars(bonus.headline || '')

  return (
    <div className="bonus-popup-overlay" role="complementary" aria-label="Kampagnetilbud">
      <div className="bonus-popup">
        <button className="bonus-popup-close" onClick={close} aria-label="Luk">×</button>

        {/* Left green badge */}
        <div className="bonus-popup-badge">
          <span>Slotsguiden</span>
          <strong>Anbefaler</strong>
        </div>

        {/* Body */}
        <div className="bonus-popup-body">
          <div className="bonus-popup-main">

            {/* Logo */}
            {bonus.logo?.url && (
              <div className="bonus-popup-logo">
                <Image src={bonus.logo.url} alt={bonus.logo.alt || name} width={72} height={72} style={{ objectFit: 'contain', width: '100%', height: '100%', display: 'block' }} />
              </div>
            )}

            {/* Name + stats */}
            <div className="bonus-popup-info" style={{ minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                {name}
              </h3>
              <div className="bonus-popup-stats" style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {bonus.minimumIndbetaling != null && <Stat icon="wallet" label="Min. indbetaling" value={`${bonus.minimumIndbetaling} kr.`} />}
                {bonus.gennemspilskrav && <Stat icon="refresh-circle" label="Omsætningskrav" value={bonus.gennemspilskrav} />}
              </div>
            </div>

            {/* Offer box */}
            <div className="bonus-popup-offer" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              {headline && (
                <div className="bonus-popup-headline">{headline}</div>
              )}
              <a href={bonus.offerUrl || '#'} target="_blank" rel="nofollow sponsored noopener noreferrer"
                 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--btn)', color: '#fff', fontWeight: 700, fontSize: '15px', padding: '12px', borderRadius: '9px', textDecoration: 'none' }}>
                Få bonus nu <Icon name="alt-arrow-right" size={15} color="#fff" />
              </a>
            </div>
          </div>

          {/* Terms */}
          {bonus.terms && (
            <div className="bonus-popup-terms">{bonus.terms}</div>
          )}
        </div>
      </div>
    </div>
  )
}
