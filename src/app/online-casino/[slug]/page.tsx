import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { getBookmakerBySlug, getPosts, getSiteSettings, clientNoCdn, getHreflangScript } from '@/lib/sanity'
import { HreflangHead } from '@/components/HreflangHead'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { AuthorBio } from '@/components/AuthorBio'
import { RelatedPages } from '@/components/RelatedPages'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

const DK_MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']

/** Format an "established/launched" value. "20260301" → "marts 2026"; "2012" → "2012"; else passthrough. */
function formatLaunch(value?: string | null): string {
  if (!value) return ''
  const v = String(value).trim()
  if (/^\d{8}$/.test(v)) {
    const y = v.slice(0, 4), m = parseInt(v.slice(4, 6), 10)
    if (m >= 1 && m <= 12) return `${DK_MONTHS[m - 1]} ${y}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const [y, m] = v.split('-')
    const mi = parseInt(m, 10)
    if (mi >= 1 && mi <= 12) return `${DK_MONTHS[mi - 1]} ${y}`
  }
  return v
}

/** Dashed-ring score circle. Score is 0–10, displayed as 0–100. */
function ScoreCircle({ score }: { score: number }) {
  const shown = Math.round(score * 10)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <div style={{
        width: '78px', height: '78px', borderRadius: '50%',
        border: '3px dashed var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text)' }}>{shown}</span>
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Slots-score</span>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Icon name={icon} size={20} color="var(--green)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '14.5px', color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const bookmakers = await clientNoCdn.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "bookmaker" && (market == "global" || !defined(market)) && defined(slug.current)] { slug }`
  ).catch(() => [])
  return bookmakers.map((b) => ({ slug: b.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const bm = await getBookmakerBySlug(slug).catch(() => null)
  if (!bm) return {}
  const title = replaceDateVars(bm.metaTitle || `${bm.name} Anmeldelse — bonus & tilbud`)
  const description = replaceDateVars(bm.metaDescription || `Læs vores anmeldelse af ${bm.name}. Se bonus, gennemspilskrav og vores vurdering.`)
  const canonical = `${BASE}/online-casino/${slug}/`
  const img = bm.ogImage?.url ? bm.ogImage : bm.logo?.url ? bm.logo : null
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: 'article',
      images: img ? [{ url: img.url, alt: img.alt || title }] : [{ url: `${BASE}/og.png` }],
    },
    twitter: {
      title, description,
      ...(img ? { images: [img.url] } : {}),
    },
  }
}

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params
  const [bm, latestPosts, settings] = await Promise.all([
    getBookmakerBySlug(slug).catch(() => null),
    getPosts(6),
    getSiteSettings().catch(() => null),
  ])
  if (!bm) notFound()
  const hreflangScript = await getHreflangScript(bm._id).catch(() => null)
  const author = settings?.defaultAuthor ?? null

  const canonical = `${BASE}/online-casino/${slug}/`

  // Merge bonuses referenced from the casino + bonuses that point back at it, deduped by _id.
  const bonusMap = new Map<string, any>()
  for (const b of [...(bm.aktBonuses ?? []), ...(bm.refBonuses ?? [])]) {
    if (b?._id && !bonusMap.has(b._id)) bonusMap.set(b._id, b)
  }
  const relatedBonuses = Array.from(bonusMap.values())
  const paymentMethods: any[] = (bm.paymentMethods ?? []).filter((p: any) => p?.logo)
  const softwareProviders: any[] = (bm.software ?? []).filter((s: any) => s?.logo)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Casinoanmeldelser', item: `${BASE}/online-casino/` },
          { '@type': 'ListItem', position: 3, name: bm.name, item: canonical },
        ],
      },
      {
        '@type': 'Review',
        itemReviewed: { '@type': 'Organization', name: bm.name, url: bm.url },
        reviewRating: bm.score != null ? { '@type': 'Rating', ratingValue: bm.score, bestRating: 10 } : undefined,
        author: { '@type': 'Organization', name: 'Slotsguiden' },
        url: canonical,
      },
    ],
  }

  return (
    <>
      <HreflangHead script={hreflangScript} />
      <JsonLd data={jsonLd} />
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border)', padding: '28px 15px 40px' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
          <Breadcrumbs crumbs={[
            { label: 'Hjem', href: '/' },
            { label: 'Casinoanmeldelser', href: '/online-casino/' },
            { label: bm.name },
          ]} />

          <div className="cr-grid">
            {/* ── LEFT: main hero card + payment/software card ── */}
            <div className="cr-left">

              {/* Main hero card */}
              <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <div className="cr-card-top">

                  {/* Identity: logo + title + pills */}
                  <div className="cr-identity">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {(bm.logoSquare?.url || bm.logo?.url) && (
                        <div style={{ width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {bm.logoSquare?.url ? (
                            <Image src={bm.logoSquare.url} alt={bm.logoSquare.alt || bm.name} width={68} height={68} style={{ objectFit: 'cover', width: '68px', height: '68px', display: 'block' }} />
                          ) : (
                            <Image src={bm.logo.url} alt={bm.logo.alt || bm.name} width={68} height={68} style={{ objectFit: 'contain', maxWidth: '60px', maxHeight: '60px', width: 'auto', height: 'auto', display: 'block' }} />
                          )}
                        </div>
                      )}
                      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.4vw, 28px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, margin: 0 }}>
                        {replaceDateVars(bm.titel || `${bm.name} Anmeldelse`)}
                      </h1>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(10,95,62,0.1)', color: 'var(--green-dark)', border: '1px solid rgba(10,95,62,0.25)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}>
                        <Icon name="shield-check" size={16} color="var(--green)" /> {bm.license || 'Dansk spillelicens'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(217,119,6,0.1)', color: '#b45309', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}>
                        <Icon name="verified-check" size={16} color="#d97706" /> Slotsguiden verificeret
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="cr-stats">
                    {bm.minIndbetaling != null && <Stat icon="wallet" label="Min. indbetaling" value={`${bm.minIndbetaling} kr.`} />}
                    {bm.trustpilot && <Stat icon="star" label="Trustpilot" value={bm.trustpilot} />}
                    {bm.lanceringsdato && <Stat icon="rocket-2" label="Lanceret i" value={formatLaunch(bm.lanceringsdato)} />}
                  </div>

                  {/* Score */}
                  {bm.score != null && <ScoreCircle score={bm.score} />}
                </div>

                {/* CTA */}
                {bm.url && (
                  <a href={bm.url} target="_blank" rel="nofollow noopener noreferrer sponsored"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--btn)', color: '#fff', fontSize: '17px', fontWeight: 700, padding: '16px', borderRadius: '10px', textDecoration: 'none', marginTop: '20px' }}>
                    Gå til casino <Icon name="alt-arrow-right" size={18} color="#fff" />
                  </a>
                )}

                {/* Terms */}
                {bm.terms && (
                  <p style={{ fontSize: '10.5px', color: 'var(--text-faint)', margin: '14px 0 0', lineHeight: 1.5 }}>{bm.terms}</p>
                )}
              </div>

              {/* Payment methods + software */}
              {(paymentMethods.length > 0 || softwareProviders.length > 0) && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                  <div className="cr-logos">
                    {paymentMethods.length > 0 && (
                      <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>🏛️ Betalingsmetoder</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                          {paymentMethods.map((p) => (
                            <Link key={p._id} href={`/betalingsmetoder/${p.slug}/`} title={p.name} style={{ display: 'block' }}>
                              <Image src={p.logo} alt={p.alt || p.name} width={68} height={30} style={{ objectFit: 'contain', height: '30px', width: 'auto' }} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {softwareProviders.length > 0 && (
                      <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>🎮 Spiludviklere</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                          {softwareProviders.map((s) => (
                            <Link key={s._id} href={`/spiludviklere/${s.slug}/`} title={s.name} style={{ display: 'block' }}>
                              <Image src={s.logo} alt={s.alt || s.name} width={78} height={30} style={{ objectFit: 'contain', height: '30px', width: 'auto' }} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: active bonuses ── */}
            {relatedBonuses.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>🎁 Aktive bonusser</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {relatedBonuses.map((b) => {
                    const href = b.slug ? `/casino-kampagner/${b.slug}/` : (b.offerUrl || '#')
                    return (
                      <Link key={b._id} href={href}
                        style={{ display: 'block', background: 'rgba(123,182,100,0.18)', border: '1px solid rgba(123,182,100,0.5)', borderRadius: '10px', padding: '16px', textAlign: 'center', fontSize: '15px', fontWeight: 700, color: 'var(--green-dark)', textDecoration: 'none', lineHeight: 1.4 }}>
                        {b.label || b.title}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {bm.url && (
        <StickyCtaBar url={bm.url} name={bm.name} logoUrl={bm.logo?.url ?? null} logoAlt={bm.logo?.alt ?? null} bonus={bm.indbetalingsbonus ?? null} terms={bm.terms ?? null} />
      )}

      <div className="article-layout">
        <article className="article-content">
          {bm.body && <MobileToc body={bm.body} />}
          {bm.body && <PortableTextRenderer value={bm.body} posts={latestPosts as any} />}
        </article>
        {bm.body && (
          <aside className="toc-sidebar">
            <TableOfContents body={bm.body} />
          </aside>
        )}
      </div>

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}

      <Footer />
      <RelatedPages docId={bm?._id} />
    </>
  )
}
