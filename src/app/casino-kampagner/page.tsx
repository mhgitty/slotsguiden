import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { client } from '@/lib/sanity'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'
const CANONICAL = `${BASE}/casino-kampagner/`

export const metadata: Metadata = {
  title: 'Casino kampagner & bonusser',
  description: 'Se de nyeste casino kampagner, free spins og bonusser fra danske onlinecasinoer.',
  alternates: { canonical: CANONICAL },
  openGraph: { title: 'Casino kampagner & bonusser', description: 'Se de nyeste casino kampagner, free spins og bonusser.', url: CANONICAL, type: 'website' },
}

export default async function CasinoKampagnerPage() {
  const bonuses = await client.fetch<any[]>(
    `*[_type == "bonus" && defined(slug.current) && (market == "global" || !defined(market))] | order(coalesce(publishedAt, _createdAt) desc) {
      _id, title, "slug": slug.current, casinoNavn,
      "logo": coalesce(casinoLogoSquare, casinoLogo) { "url": asset->url, alt },
      "date": coalesce(publishedAt, _createdAt)
    }`
  ).catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${CANONICAL}#webpage`,
    url: CANONICAL, name: 'Casino kampagner & bonusser', inLanguage: 'da-DK',
    publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />
      <div className="section">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.4vw, 36px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: '24px' }}>
          Casino kampagner & bonusser
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {bonuses.map((b) => (
            <Link key={b._id} href={`/casino-kampagner/${b.slug}/`} style={{ display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: 'var(--bg-card)', textDecoration: 'none' }}>
              {b.logo?.url && (
                <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0, borderRadius: '9px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <Image src={b.logo.url} alt={b.logo.alt ?? b.casinoNavn ?? ''} fill style={{ objectFit: 'cover' }} sizes="44px" />
                </div>
              )}
              <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>{b.title}</span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
