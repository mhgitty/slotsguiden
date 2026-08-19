import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { LoadMoreGrid } from '@/components/LoadMoreGrid'
import { Icon } from '@/components/Icon'
import { blocksToPlainText } from '@/lib/dateVars'
import {
  getAuthorBySlug, getPostsByAuthor, getAuthorPaths,
  getSiteSettings, getBookmakers, getBonusesForListing, getSpillemaskiner, getPrimaryAuthorId,
} from '@/lib/sanity'

// author.intro is Portable Text; author.bio is a plain string.
const introText = (a: any): string => (Array.isArray(a?.intro) ? blocksToPlainText(a.intro) : (a?.intro || a?.bio || ''))
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
  const description = author.metaDescription || introText(author) || `Artikler og anmeldelser af ${author.name}.`
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

  const posts = await getPostsByAuthor(author._id, 300).catch(() => [])

  // "Main author" gets the review archives (casinos, bonuses, spillemaskiner).
  // Prefer the Site Settings default author; fall back to the author with the
  // most posts so this works before the default author is set.
  const [settings, primaryAuthorId] = await Promise.all([
    getSiteSettings().catch(() => null),
    getPrimaryAuthorId().catch(() => null),
  ])
  const mainAuthorId = (settings as any)?.defaultAuthor?._id || primaryAuthorId
  const isMainAuthor = !!mainAuthorId && author._id === mainAuthorId

  const [casinos, bonuses, spil] = isMainAuthor
    ? await Promise.all([
        getBookmakers().catch(() => []),
        getBonusesForListing().catch(() => []),
        getSpillemaskiner().catch(() => []),
      ])
    : [[], [], []]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: author.name,
        url: `${BASE}/author/${slug}/`,
        jobTitle: author.role,
        description: introText(author),
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
                    <a href={author.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" /></svg>
                    </a>
                  )}
                  {author.x && (
                    <a href={author.x} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z" /></svg>
                    </a>
                  )}
                  {author.facebook && (
                    <a href={author.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z" /></svg>
                    </a>
                  )}
                </div>
              )}

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMainAuthor ? '1fr 1fr' : '1fr',
                gap: '8px', width: '100%',
              }}>
                {[
                  { label: 'Artikler', value: posts.length },
                  ...(isMainAuthor ? [
                    { label: 'Casinoer', value: (casinos as any[]).length },
                    { label: 'Bonusser', value: (bonuses as any[]).length },
                    { label: 'Spil', value: (spil as any[]).length },
                  ] : []),
                ].map((s) => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{s.value}</div>
                  </div>
                ))}
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

              {introText(author) && (
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Sammenfatning</div>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>
                    {introText(author)}
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
          <LoadMoreGrid initial={9} moreLabel="Vis flere artikler">
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
          </LoadMoreGrid>
        )}
      </div>

      {/* ── Casino reviews ────────────────────────────────────────────────── */}
      {isMainAuthor && (casinos as any[]).length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '24px' }}>
            Casinoanmeldelser af {author.name}
            <span style={{ marginLeft: '10px', fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>({(casinos as any[]).length})</span>
          </h2>
          <LoadMoreGrid initial={10} moreLabel="Vis flere casinoer">
            {(casinos as any[]).map((c: any) => {
              const sq = c.logoSquare?.url ? c.logoSquare : null
              const logo = sq || (c.logo?.url ? c.logo : null)
              return (
                <Link key={c._id} href={`/online-casino/${c.slug.current}/`} className="slot-card" style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {logo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo.url} alt={logo.alt || c.name} style={sq ? { width: '56px', height: '56px', objectFit: 'cover', display: 'block' } : { maxWidth: '48px', maxHeight: '40px', objectFit: 'contain', display: 'block' }} />
                    ) : (
                      <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{c.name.charAt(0)}</span>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    {c.score != null && <ScoreBadge score={c.score} />}
                  </div>
                  <Icon name="alt-arrow-right" size={16} color="var(--text-faint)" />
                </Link>
              )
            })}
          </LoadMoreGrid>
        </div>
      )}

      {/* ── Bonus reviews ─────────────────────────────────────────────────── */}
      {isMainAuthor && (bonuses as any[]).length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '24px' }}>
            Bonusanmeldelser af {author.name}
            <span style={{ marginLeft: '10px', fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>({(bonuses as any[]).length})</span>
          </h2>
          <LoadMoreGrid initial={10} moreLabel="Vis flere bonusser">
            {(bonuses as any[]).map((b: any) => (
              <Link key={b._id} href={`/casino-kampagner/${b.slug}/`} className="slot-card" style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {b.logo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo.url} alt={b.logo.alt || b.casinoName || b.title} style={{ width: '56px', height: '56px', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{(b.casinoName || b.title || '?').charAt(0)}</span>
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {b.casinoName && <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.casinoName}</span>}
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '14.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.title}</span>
                </div>
                <Icon name="alt-arrow-right" size={16} color="var(--text-faint)" />
              </Link>
            ))}
          </LoadMoreGrid>
        </div>
      )}

      {/* ── Spillemaskine reviews ─────────────────────────────────────────── */}
      {isMainAuthor && (spil as any[]).length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '24px' }}>
            Spillemaskiner anmeldt af {author.name}
            <span style={{ marginLeft: '10px', fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>({(spil as any[]).length})</span>
          </h2>
          <LoadMoreGrid initial={10} moreLabel="Vis flere spillemaskiner">
            {(spil as any[]).map((g: any) => {
              const gameName = (g.name || '')
                .replace(/\s*Anmeldelse\b.*$/i, '')
                .replace(/\s*Gratis Spillemaskine Demo\b.*$/i, '')
                .replace(/\s*[–—-]\s*Gratis Demo\b.*$/i, '')
                .replace(/\s*Gratis Demo\b.*$/i, '')
                .trim() || g.name
              return (
                <Link key={g._id} href={`/online-spillemaskiner/${g.slug}/`} className="slot-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                  <div className="slot-card__media" style={{ position: 'relative', width: '100%', aspectRatio: '16/10', background: 'var(--bg-raised)' }}>
                    {g.featuredImage?.url && (
                      <Image src={g.featuredImage.url} alt={g.featuredImage.alt ?? gameName} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 50vw, 260px" />
                    )}
                  </div>
                  <div style={{ padding: '13px 15px 15px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gameName}</span>
                  </div>
                </Link>
              )
            })}
          </LoadMoreGrid>
        </div>
      )}

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
