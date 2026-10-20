'use client'
import { useState } from 'react'

// Footer newsletter signup — posts to the same Klaviyo list as the email flyout.
const COMPANY_ID = process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID
const LIST_ID = process.env.NEXT_PUBLIC_KLAVIYO_LIST_ID
const KLAVIYO_REVISION = '2026-04-15'
const SUBSCRIBED_KEY = 'sg-email-subscribed'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function FooterNewsletter({ title, text }: { title: string; text: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'loading') return
    const value = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) { setStatus('error'); setMsg('Indtast venligst en gyldig e-mailadresse.'); return }
    if (!COMPANY_ID || !LIST_ID) { setStatus('error'); setMsg('Tilmelding er ikke konfigureret endnu.'); return }
    setStatus('loading'); setMsg('')
    try {
      const res = await fetch(`https://a.klaviyo.com/client/subscriptions?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', revision: KLAVIYO_REVISION },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              custom_source: 'Slotsguiden – Footer',
              profile: { data: { type: 'profile', attributes: { email: value } } },
            },
            relationships: { list: { data: { type: 'list', id: LIST_ID } } },
          },
        }),
      })
      if (res.status === 202 || res.ok) {
        setStatus('success'); setMsg('Tak! Tjek din indbakke for at bekræfte.')
        try { localStorage.setItem(SUBSCRIBED_KEY, '1') } catch { /* ignore */ }
      } else { setStatus('error'); setMsg('Noget gik galt. Prøv igen om lidt.') }
    } catch { setStatus('error'); setMsg('Noget gik galt. Prøv igen om lidt.') }
  }

  return (
    <div className="ft-news">
      <div>
        <div className="ft-news-title">{title}</div>
        <p className="ft-news-text">{text}</p>
      </div>
      <div>
        {status === 'success' ? (
          <p className="ft-news-ok" role="status">{msg}</p>
        ) : (
          <form className="ft-news-form" onSubmit={submit} noValidate>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
              placeholder="Din e-mail"
              aria-label="Din e-mail"
              autoComplete="email"
            />
            <button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Sender…' : 'Tilmeld'}</button>
          </form>
        )}
        <small className={status === 'error' ? 'ft-news-err' : undefined} role={status === 'error' ? 'alert' : undefined}>
          {status === 'error' ? msg : '18+ · Ved tilmelding accepterer du vores vilkår og privatlivspolitik.'}
        </small>
      </div>
    </div>
  )
}
