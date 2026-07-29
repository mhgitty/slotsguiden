'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Icon } from '@/components/Icon'

// ── Copy (edit freely) ──────────────────────────────────────────────────────
const LEAD = 'Tilmeld dig nu og modtag'
const HEADLINE = '350 gratis spins uden indbetaling'
const CTA = 'Modtag Gratis Spins'
const SUCCESS = 'Tak! Tjek din indbakke for at bekræfte.'
const CONSENT = '18+ | Ved tilmelding accepterer du vores vilkår og privatlivspolitik.'

// Drop a wheel/prize image in /public and set its path here to show it on the
// left panel (e.g. '/spinwheel.png'). Leave '' to use the gradient + icon.
const PRIZE_IMAGE = ''

const DELAY_MS = 15000
const DISMISS_KEY = 'sg-email-dismissed'
const SUBSCRIBED_KEY = 'sg-email-subscribed'
const KLAVIYO_REVISION = '2026-04-15'

const COMPANY_ID = process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID
const LIST_ID = process.env.NEXT_PUBLIC_KLAVIYO_LIST_ID

type Status = 'idle' | 'loading' | 'success' | 'error'

export function EmailFlyout() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const inStudio = pathname?.startsWith('/studio')

  useEffect(() => {
    if (inStudio) return
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY)) return
      if (sessionStorage.getItem(DISMISS_KEY)) return
    } catch { /* ignore */ }
    const t = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [inStudio])

  if (!open || inStudio) return null

  const close = () => {
    setOpen(false)
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'loading') return
    const value = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setStatus('error'); setErrorMsg('Indtast venligst en gyldig e-mailadresse.')
      return
    }
    if (!COMPANY_ID || !LIST_ID) {
      setStatus('error'); setErrorMsg('Tilmelding er ikke konfigureret endnu.')
      return
    }
    setStatus('loading'); setErrorMsg('')
    try {
      const res = await fetch(`https://a.klaviyo.com/client/subscriptions?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', revision: KLAVIYO_REVISION },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: { email: value, custom_source: 'Slotsguiden – Gratis spins flyout' },
            relationships: { list: { data: { type: 'list', id: LIST_ID } } },
          },
        }),
      })
      if (res.status === 202 || res.ok) {
        setStatus('success')
        try { localStorage.setItem(SUBSCRIBED_KEY, '1') } catch { /* ignore */ }
      } else {
        setStatus('error'); setErrorMsg('Noget gik galt. Prøv igen om lidt.')
      }
    } catch {
      setStatus('error'); setErrorMsg('Noget gik galt. Prøv igen om lidt.')
    }
  }

  return (
    <div className="email-flyout" role="complementary" aria-label="Nyhedsbrev">
      <button className="email-flyout-close" onClick={close} aria-label="Luk">×</button>

      {/* Prize panel */}
      <div className="email-flyout-img" style={PRIZE_IMAGE ? { backgroundImage: `url(${PRIZE_IMAGE})` } : undefined}>
        {!PRIZE_IMAGE && <Icon name="wad-of-money" size={44} color="#fff" />}
      </div>

      {/* Body */}
      <div className="email-flyout-body">
        {status === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
            <Icon name="check-circle" size={40} color="var(--green)" />
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>{SUCCESS}</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '2px' }}>{LEAD}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.25, marginBottom: '14px' }}>
              {HEADLINE}
            </div>
            <form onSubmit={submit}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="E-mail"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 14px', fontSize: '14px',
                  border: '1px solid var(--border)', borderRadius: '9px',
                  background: 'var(--bg)', color: 'var(--text)', outline: 'none',
                  marginBottom: '10px',
                }}
              />
              {status === 'error' && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '10px' }}>{errorMsg}</div>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', border: 'none', cursor: status === 'loading' ? 'default' : 'pointer',
                  background: 'var(--btn)', color: '#fff',
                  fontSize: '15px', fontWeight: 700, padding: '13px',
                  borderRadius: '9px', opacity: status === 'loading' ? 0.7 : 1,
                }}
              >
                {status === 'loading' ? 'Sender…' : CTA}
              </button>
            </form>
            <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '10px 0 0', lineHeight: 1.5 }}>{CONSENT}</p>
          </>
        )}
      </div>
    </div>
  )
}
