import Link from 'next/link'
import { getPosts, getCategories } from '@/lib/sanity'
import { PostCard } from '@/components/PostCard'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

interface Props { params: Promise<{ category: string }> }

export async function generateStaticParams() {
  const categories = await getCategories().catch(() => [])
  return categories.map((c: any) => ({ category: c.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categories = await getCategories().catch(() => [])
  const cat = categories.find((c: any) => c.slug.current === category)
  if (!cat) return {}
  const title = `${cat.name} artikler — Slotsguiden`
  const description = cat.description || `Gennemse alle ${cat.name}-guider og artikler fra Slotsguiden.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/news/${category}/` },
    openGraph: { title, description, url: `${BASE}/news/${category}/` },
  }
}

export default async function CategoryArchivePage({ params }: Props) {
  const { category } = await params

  const [posts, categories] = await Promise.all([
    getPosts(200, category),
    getCategories(),
  ])

  const cat = categories.find((c: any) => c.slug.current === category)
  if (!cat) notFound()

  return (
    <>
      <Navbar />
      {/* Hero */}
      <div style={{ background: 'var(--bg-hero)', padding: '48px 0 40px' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 15px' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '16px' }}>
            <Link href="/news/" style={{ color: 'var(--text-faint)', textDecoration: 'none' }}>Nyheder</Link>
            <span style={{ margin: '0 6px' }}>›</span>
            <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            {cat.emoji && <span style={{ fontSize: '32px' }}>{cat.emoji}</span>}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '34px',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.04em',
              margin: 0,
            }}>
              {cat.name}
            </h1>
          </div>
          {cat.description && (
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '560px', lineHeight: 1.65 }}>
              {cat.description}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '32px 15px 64px' }}>
        {/* Other category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          <Link href="/news/" style={{
            padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
            textDecoration: 'none', background: 'var(--bg-card)', color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            ← Alle
          </Link>
          {categories.filter((c: any) => c.slug.current !== category).map((c: any) => (
            <Link key={c._id} href={`/news/${c.slug.current}/`} style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              textDecoration: 'none', background: 'var(--bg-card)', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}>
              {c.emoji && `${c.emoji} `}{c.name}
            </Link>
          ))}
        </div>

        {/* Post count */}
        <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '20px' }}>
          {posts.length} {posts.length === 1 ? 'artikel' : 'artikler'}
        </p>

        {/* Grid */}
        {posts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="news-grid">
            {posts.map((post: any) => (
              <PostCard key={post._id} {...post} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            Ingen artikler fundet i denne kategori endnu.
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .news-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .news-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  )
}
