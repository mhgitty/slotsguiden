import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// Custom 404 — replaces the bare fallback. Rendered by Next whenever a route
// isn't found or a page calls notFound(). Uses the site chrome (nav + footer)
// so a dead link still feels like part of Slotsguiden, and points visitors at
// the pages that actually convert.
export const metadata = {
  title: 'Siden blev ikke fundet (404) — Slotsguiden',
  description: 'Vi kunne desværre ikke finde den side, du ledte efter. Find de bedste casinoer og bonusser her.',
  robots: { index: false, follow: true },
}

const LINKS: { label: string; href: string; sub: string }[] = [
  { label: 'Alle casinoer',        href: '/online-casino/',        sub: 'Se og sammenlign alle anmeldelser' },
  { label: 'Bedste bonusser',      href: '/online-casino/bonus/',  sub: 'De bedste velkomsttilbud lige nu' },
  { label: 'Guides & artikler',    href: '/blog',                  sub: 'Tips, nyheder og strategier' },
  { label: 'Til forsiden',         href: '/',                      sub: 'Start forfra på Slotsguiden' },
]

export default async function NotFound() {
  return (
    <>
      <Navbar />

      <main
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '80px 20px 96px',
          textAlign: 'center',
          minHeight: '52vh',
        }}
      >
        {/* Big 404 mark */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(88px, 20vw, 168px)',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: 'var(--green)',
            marginBottom: '8px',
          }}
        >
          4<span style={{ color: 'var(--gold)' }}>0</span>4
        </div>

        <h1
          style={{
            fontSize: 'clamp(24px, 5vw, 34px)',
            fontWeight: 800,
            color: 'var(--text)',
            margin: '0 0 12px',
          }}
        >
          Ups — siden findes ikke
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: '0 auto 36px',
          }}
        >
          Den side, du ledte efter, er enten flyttet, fjernet eller har aldrig
          eksisteret. Men bare rolig — herunder finder du hurtigt videre.
        </p>

        {/* Quick links */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            textAlign: 'left',
            marginBottom: '36px',
          }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'block',
                padding: '18px 20px',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
              }}
            >
              <div style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
                {l.label}
                <span style={{ color: 'var(--green)', marginLeft: '6px' }}>→</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {l.sub}
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: 'var(--btn)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            padding: '14px 30px',
            borderRadius: '10px',
            textDecoration: 'none',
          }}
        >
          Tilbage til forsiden
        </Link>
      </main>

      <Footer />
    </>
  )
}
