import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { getSpillemaskiner } from '@/lib/sanity'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'
const CANONICAL = `${BASE}/online-spillemaskiner/`

export const metadata: Metadata = {
  title: 'Online spillemaskiner — gratis demoer & anmeldelser',
  description: 'Spil de nyeste online spillemaskiner gratis, og læs vores anmeldelser med demo, spilinfo og funktioner.',
  alternates: { canonical: CANONICAL },
  openGraph: { title: 'Online spillemaskiner', description: 'Spil de nyeste online spillemaskiner gratis, og læs vores anmeldelser.', url: CANONICAL, type: 'website' },
}

export default async function SpillemaskinerPage() {
  const games = await getSpillemaskiner().catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${CANONICAL}#webpage`,
    url: CANONICAL, name: 'Online spillemaskiner', inLanguage: 'da-DK',
    publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border)', padding: '48px 0 40px' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 15px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Online spillemaskiner
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: 1.65, margin: 0 }}>
            Spil de nyeste spillemaskiner gratis, og læs vores anmeldelser med demo, spilinfo og funktioner.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '40px 15px 64px' }}>
        {games.length === 0 ? (
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Der er ingen spillemaskiner endnu.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {games.map((g: any) => (
              <Link key={g._id} href={`/online-spillemaskiner/${g.slug}/`}
                style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-card)', textDecoration: 'none' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'var(--bg-raised)' }}>
                  {g.featuredImage?.url && (
                    <Image src={g.featuredImage.url} alt={g.featuredImage.alt ?? g.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 300px" />
                  )}
                </div>
                <div style={{ padding: '14px 16px 16px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '15.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{g.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}
