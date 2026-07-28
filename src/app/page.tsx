import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { Icon } from '@/components/Icon'
import { RichIntro } from '@/components/RichIntro'
import { getPosts, getHomepage, getBookmakers, getHreflangScript } from '@/lib/sanity'
import { HreflangHead } from '@/components/HreflangHead'
import { replaceDateVars } from '@/lib/dateVars'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

export async function generateMetadata(): Promise<Metadata> {
  const hp = await getHomepage().catch(() => null)
  const title = replaceDateVars(hp?.metaTitle || 'Bedste onlinecasinobonusser — Sammenlign toptilbud')
  const description = replaceDateVars(hp?.metaDescription || 'Din uafhængige danske guide til onlinecasinobonusser. Vi sammenligner og anmelder alle de bedste casinoer.')
  return {
    title,
    description,
    alternates: { canonical: BASE + '/' },
    openGraph: { title, description, url: BASE + '/', type: 'website', images: hp?.ogImage?.url ? [{ url: hp.ogImage.url }] : [{ url: `${BASE}/og.png` }] },
    twitter: { title, description },
  }
}

export default async function HomePage() {
  const [posts, hp, bookmakers] = await Promise.all([
    getPosts(20).catch(() => []),
    getHomepage().catch(() => null),
    getBookmakers().catch(() => []),
  ])

  const heroHeading = replaceDateVars(hp?.heroHeading || 'Find de bedste onlinecasinobonusser')
  const heroIntro = hp?.intro ?? 'Vi sammenligner og anmelder alle de bedste onlinecasinoer. Find den bedste velkomstbonus og kom i gang i dag.'

  const latestSectionTitle   = hp?.latestSectionTitle   || 'Seneste'
  const casinoReviewsTitle   = hp?.casinoReviewsTitle   || 'Bedste casinoanmeldelser'
  const topRatedTitle        = hp?.topRatedTitle        || 'Højest rangerede casinoer'
  const featuredSectionTitle = hp?.featuredSectionTitle || 'Udvalgte'

  const trustItems: { _key: string; icon?: string; title: string; body: string }[] = hp?.trustItems?.length > 0
    ? hp.trustItems
    : [
        { _key: 'trust-1', icon: 'cup-star',           title: 'Betroet af brands & spillere',    body: 'Operatører, spiludviklere, spillere, store medier og mange nøglepersoner anbefaler Slotsguiden som deres førstevalg.' },
        { _key: 'trust-2', icon: 'medal-ribbons-star',  title: 'Brancheførende',               body: 'Den eneste platform for nyheder, anmeldelser og ranking af denne slags i verden med over et årti med erfaring.' },
        { _key: 'trust-3', icon: 'scale',               title: 'Uafhængig & transparent',      body: 'Helejet, ingen eksterne investorer eller påvirkning. Vi benytter uafhængige journalister fra hele verden.' },
      ]

  const faqs = (hp?.body ?? [])
    .filter((b: any) => b._type === 'faqBlock')
    .flatMap((b: any) => b.items ?? [])
    .filter((f: any) => f.question && f.answer)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        url: BASE,
        name: 'Slotsguiden.dk',
        inLanguage: 'da-DK',
      },
      {
        '@type': 'Organization',
        '@id': `${BASE}/#organization`,
        name: 'Slotsguiden',
        url: BASE,
        logo: { '@type': 'ImageObject', url: `${BASE}/logo.webp` },
      },
      ...(faqs.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: faqs.map((f: any) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }] : []),
    ],
  }

  const hreflangScript = await getHreflangScript('homepage').catch(() => null)

  const postList = posts as any[]
  const topBookmakers = (bookmakers as any[]).slice(0, 4)

  // Group posts by category for Featured section
  const categoryMap: Record<string, { name: string; slug: string; posts: any[] }> = {}
  for (const post of postList) {
    const catName = post.category?.name
    if (!catName) continue
    if (!categoryMap[catName]) {
      categoryMap[catName] = {
        name: catName,
        slug: post.category?.slug?.current ?? '',
        posts: [],
      }
    }
    if (categoryMap[catName].posts.length < 4) {
      categoryMap[catName].posts.push(post)
    }
  }
  const featuredCategories = Object.values(categoryMap).filter(c => c.posts.length > 0).slice(0, 4)

  const featuredPost = postList[0] ?? null
  const sidebarPosts = postList.slice(1, 5)

  return (
    <>
      <HreflangHead script={hreflangScript} />
      <JsonLd data={jsonLd} />
      <Navbar />

      {/* Hero */}
      <section className="hero-section">
        <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
          <h1 className="hero-heading">
            {heroHeading}
          </h1>
          <p className="hero-subtext">
            {typeof heroIntro === 'string' ? replaceDateVars(heroIntro) : <RichIntro value={heroIntro} />}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 15px' }}>

        {/* ── 1. LATEST SECTION ───────────────────────────────────────────── */}
        {postList.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              padding: '28px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '24px',
              }}>{latestSectionTitle}</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
                gap: '24px',
              }}
                className="latest-grid"
              >
                {/* Featured post */}
                {featuredPost && (
                  <a href={`/${featuredPost.slug?.current ?? ''}/`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {featuredPost.featuredImage?.url && (
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                          <Image
                            src={featuredPost.featuredImage.url}
                            alt={featuredPost.featuredImage.alt ?? featuredPost.title ?? ''}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, 560px"
                          />
                        </div>
                      )}
                      {featuredPost.category?.name && (
                        <span style={{
                          display: 'inline-block',
                          background: 'var(--green)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          marginBottom: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          width: 'fit-content',
                        }}>
                          {featuredPost.category.name}
                        </span>
                      )}
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: '10px',
                        lineHeight: 1.3,
                      }}>{featuredPost.title}</h3>
                      {featuredPost.excerpt && (
                        <p style={{ fontSize: '14px', color: 'var(--text-muted, #888)', lineHeight: 1.6, marginBottom: '10px' }}>
                          {featuredPost.excerpt}
                        </p>
                      )}
                      {featuredPost.publishedAt && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                          {new Date(featuredPost.publishedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </a>
                )}

                {/* Sidebar posts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sidebarPosts.map((post: any) => (
                    <a key={post._id} href={`/${post.slug?.current ?? ''}/`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {post.featuredImage?.url && (
                          <div style={{ position: 'relative', width: '80px', minWidth: '80px', height: '56px', borderRadius: '6px', overflow: 'hidden' }}>
                            <Image
                              src={post.featuredImage.url}
                              alt={post.featuredImage.alt ?? post.title ?? ''}
                              fill
                              style={{ objectFit: 'cover' }}
                              sizes="80px"
                            />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {post.category?.name && (
                            <span style={{
                              display: 'inline-block',
                              background: 'var(--green)',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '3px',
                              marginBottom: '5px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}>
                              {post.category.name}
                            </span>
                          )}
                          <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text)',
                            lineHeight: 1.35,
                            marginBottom: '4px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          } as React.CSSProperties}>{post.title}</p>
                          {post.publishedAt && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                              {new Date(post.publishedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* View all button */}
              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <a href="/" style={{
                  display: 'inline-block',
                  padding: '10px 28px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  textDecoration: 'none',
                  background: 'transparent',
                }}>Vis alle artikler</a>
              </div>
            </div>
          </section>
        )}

        {/* ── 2. CASINO RANKINGS SECTION ──────────────────────────────────── */}
        {topBookmakers.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              padding: '28px',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '32px',
              }}
                className="rankings-grid"
              >
                {/* Table 1 */}
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '16px',
                  }}>{casinoReviewsTitle}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topBookmakers.map((bm: any, i: number) => (
                      <div key={bm._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        background: 'var(--bg)',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '16px',
                          color: 'var(--text-muted, #888)',
                          minWidth: '20px',
                          textAlign: 'center',
                        }}>{i + 1}</span>
                        {bm.logo?.url ? (
                          <div style={{ position: 'relative', width: '48px', height: '32px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                            <Image
                              src={bm.logo.url}
                              alt={bm.logo.alt ?? bm.name ?? ''}
                              fill
                              style={{ objectFit: 'contain' }}
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div style={{ width: '48px', height: '32px', background: 'var(--border)', borderRadius: '4px', flexShrink: 0 }} />
                        )}
                        <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{bm.name}</span>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {bm.url && (
                            <a href={bm.url} target="_blank" rel="nofollow noopener noreferrer sponsored" style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              background: 'var(--green)',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}>Tilmeld dig</a>
                          )}
                          {bm.slug?.current && (
                            <a href={`/review/${bm.slug.current}/`} style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              border: '1px solid var(--green)',
                              color: 'var(--green)',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              background: 'transparent',
                            }}>Anmeldelse</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table 2 */}
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '16px',
                  }}>{topRatedTitle}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topBookmakers.map((bm: any, i: number) => (
                      <div key={bm._id + '-2'} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        background: 'var(--bg)',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '16px',
                          color: 'var(--text-muted, #888)',
                          minWidth: '20px',
                          textAlign: 'center',
                        }}>{i + 1}</span>
                        {bm.logo?.url ? (
                          <div style={{ position: 'relative', width: '48px', height: '32px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                            <Image
                              src={bm.logo.url}
                              alt={bm.logo.alt ?? bm.name ?? ''}
                              fill
                              style={{ objectFit: 'contain' }}
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div style={{ width: '48px', height: '32px', background: 'var(--border)', borderRadius: '4px', flexShrink: 0 }} />
                        )}
                        <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{bm.name}</span>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {bm.url && (
                            <a href={bm.url} target="_blank" rel="nofollow noopener noreferrer sponsored" style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              background: 'var(--green)',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}>Tilmeld dig</a>
                          )}
                          {bm.slug?.current && (
                            <a href={`/review/${bm.slug.current}/`} style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              border: '1px solid var(--green)',
                              color: 'var(--green)',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              background: 'transparent',
                            }}>Anmeldelse</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* View all reviews button */}
              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <a href="/review/" style={{
                  display: 'inline-block',
                  padding: '10px 28px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  textDecoration: 'none',
                  background: 'transparent',
                }}>Vis alle casinoanmeldelser</a>
              </div>
            </div>
          </section>
        )}

        {/* ── 3. FEATURED BY CATEGORY ─────────────────────────────────────── */}
        {featuredCategories.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              padding: '28px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '28px',
              }}>{featuredSectionTitle}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                {featuredCategories.map(cat => (
                  <div key={cat.slug}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        margin: 0,
                      }}>{cat.name}</h3>
                      <a href={`/news/${cat.slug}/`} style={{
                        fontSize: '13px',
                        color: 'var(--green)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}>Vis alle →</a>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '16px',
                    }}
                      className="featured-cat-grid"
                    >
                      {cat.posts.map((post: any) => (
                        <a key={post._id} href={`/${post.slug?.current ?? ''}/`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div>
                            {post.featuredImage?.url && (
                              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                                <Image
                                  src={post.featuredImage.url}
                                  alt={post.featuredImage.alt ?? post.title ?? ''}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  sizes="(max-width: 768px) 50vw, 220px"
                                />
                              </div>
                            )}
                            <p style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--text)',
                              lineHeight: 1.35,
                              margin: 0,
                            }}>{post.title}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* ── 4. TRUST SECTION ────────────────────────────────────────────── */}
        <section style={{ marginTop: '48px', marginBottom: '64px' }}>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            padding: '36px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '28px',
          }}
            className="trust-grid"
          >
            {trustItems.map((item, i) => (
              <div key={item._key} style={{
                textAlign: 'center',
                padding: '0 8px',
                ...(i === 1 ? { borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' } : {}),
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <Icon name={item.icon || 'shield-check'} size={36} color="var(--green)" />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: '10px',
                }}>{item.title}</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>

      <Footer />

      <style>{`
        @media (max-width: 700px) {
          .latest-grid { grid-template-columns: 1fr !important; }
          .rankings-grid { grid-template-columns: 1fr !important; }
          .featured-cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .trust-grid { grid-template-columns: 1fr !important; }
          .trust-grid > div { border-left: none !important; border-right: none !important; border-top: 1px solid var(--border); padding-top: 24px; }
          .trust-grid > div:first-child { border-top: none; padding-top: 0; }
        }
      `}</style>
    </>
  )
}
