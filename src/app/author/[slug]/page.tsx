import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { Icon } from '@/components/Icon'
import { getAuthorBySlug, getPostsByAuthor, getAuthorPaths } from '@/lib/sanity'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const paths = await getAuthorPaths()
  return paths.map((a) => ({ slug: a.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const author = await getAuthorBySlug(slug).catch(() => null)
  if (!author) return {}
  const title = author.metaTitle || `${author.name} — ${author.role || 'Forfatter'} på Slotsguiden`
  const description = author.metaDescription || author.intro || author.bio || `Artikler og anmeldelser af ${author.name}.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/author/${slug}/` },
    openGraph: { title, description, url: `${BASE}/author/${slug}/` },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'var(--green)' : score >= 6 ? '#ca8a04' : '#dc2626'
  return (
    <span style={{ display: 'inline-block', background: color, color: '#fff', fontSize: '12px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px' }}>
      ★ {score.toFixed(1)}
    </span>
  )
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params
  const author = await getAuthorBySlug(slug).catch(() => null)
  if (!author) notFound()

  const posts = await getPostsByAuthor(author._id, 12).catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: author.name,
        url: `${BASE}/author/${slug}/`,
        jobTitle: author.role,
        description: author.intro || author.bio,
        ...(author.imageUrl ? { image: author.imageUrl } : {}),
        ...(author.linkedin ? { sameAs: [author.linkedin] } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: author.name, item: `${BASE}/author/${slug}/` },
        ],
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <HreflangLinks docId={(author as any)._id} />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-footer)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '36px', fontSize: '13px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Hjem</Link>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>Forfatter</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{author.name}</span>
          </div>

          <div className="author-hero-grid">

            {/* Left — photo + stats */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              {author.imageUrl ? (
                <div style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--green)', flexShrink: 0 }}>
                  <Image src={author.imageUrl} alt={author.name} width={160} height={160}
                    style={{ objectFit: 'cover', width: '160px', height: '160px', display: 'block' }} />
                </div>
              ) : (
                <div style={{
                  width: '160px', height: '160px', borderRadius: '50%',
                  background: 'rgba(10,95,62,0.12)', border: '3px solid var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '60px', fontWeight: 800, color: 'var(--green)',
                  fontFamily: 'var(--font-display)', flexShrink: 0,
                }}>
                  {author.name.charAt(0)}
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                  {author.name}
                </h1>
                {author.role && (
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>
                    {author.role}
                  </div>
                )}
              </div>

              {/* Social links */}
              {(author.linkedin || author.x || author.facebook) && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {author.linkedin && (
                    <a href={author.linkedin} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)' }}>
                      <Icon name="linkedin" size={16} />
                    </a>
                  )}
                  {author.x && (
                    <a href={author.x} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)' }}>
                      <Icon name="twitter" size={15} />
                    </a>
                  )}
                  {author.facebook && (
                    <a href={author.facebook} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)' }}>
                      <Icon name="facebook" size={15} />
                    </a>
                  )}
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Artikler</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{posts.length}</div>
                </div>
              </div>
            </div>

            {/* Right — info boxes + intro */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {author.education && (
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Uddannelse</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>{author.education}</div>
                </div>
              )}

              {author.expertise && (
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Ekspertise</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>{author.expertise}</div>
                </div>
              )}

              {(author.intro || author.bio) && (
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Sammenfatning</div>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>
                    {author.intro || author.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body content (if set) ─────────────────────────────────────────── */}
      {author.body && (
        <div className="article-layout">
          <article className="article-content">
            <PortableTextRenderer value={author.body} />
          </article>
        </div>
      )}

      {/* ── Articles ──────────────────────────────────────────────────────── */}
      <div className="section">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '24px' }}>
          Artikler af {author.name}
          <span style={{ marginLeft: '10px', fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>({posts.length})</span>
        </h2>

        {posts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Ingen artikler endnu.</p>
        ) : (
          <div className="blog-grid">
            {(posts as any[]).map((post: any) => (
              <Link key={post._id} href={`/${post.slug.current}/`} style={{ textDecoration: 'none' }}>
                <article style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '12px', overflow: 'hidden', height: '100%',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {post.featuredImage?.url ? (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                      <Image src={post.featuredImage.url} alt={post.featuredImage.alt || post.title}
                        fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 360px" />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '16/9', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="document-text" size={32} color="var(--text-faint)" />
                    </div>
                  )}
                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {post.category && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {post.category.emoji} {post.category.name}
                      </span>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: '8px', fontSize: '12px', color: 'var(--text-faint)', display: 'flex', gap: '12px' }}>
                      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                      {post.readingTime && <span>{post.readingTime} min. læsning</span>}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        .author-hero-grid {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .author-hero-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>
    </>
  )
}
