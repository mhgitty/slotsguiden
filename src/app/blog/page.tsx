import { getPosts } from '@/lib/sanity'
import { PostCard } from '@/components/PostCard'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'
const CANONICAL = `${BASE}/blog/`

export const metadata: Metadata = {
  title: 'Blog — Guider, nyheder & casinotips',
  description: 'Læs de nyeste casinoguider, bonustips og nyheder fra Slotsguiden-teamet.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Blog — Guider, nyheder & casinotips',
    description: 'Læs de nyeste casinoguider, bonustips og nyheder fra Slotsguiden-teamet.',
    url: CANONICAL,
    type: 'website',
  },
}

export default async function BlogPage() {
  const posts = await getPosts(500).catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${CANONICAL}#webpage`,
    url: CANONICAL,
    name: 'Blog',
    inLanguage: 'da-DK',
    publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border)', padding: '48px 0 40px' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 15px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Blog
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: 1.65, margin: 0 }}>
            Casinoguider, bonusgennemgange, strategier og nyheder fra Slotsguiden-teamet.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '40px 15px 64px' }}>
        {posts.length === 0 ? (
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Der er ingen indlæg endnu.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {posts.map((p: any) => (
              <PostCard key={p._id} {...p} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}
