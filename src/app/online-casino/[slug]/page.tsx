import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { getBookmakerBySlug, getPosts, getSiteSettings, clientNoCdn, getHreflangScript } from '@/lib/sanity'
import { HreflangHead } from '@/components/HreflangHead'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import { AuthorBio } from '@/components/AuthorBio'
import { ReviewHero } from '@/components/hero/ReviewHero'
import { RelatedPages } from '@/components/RelatedPages'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

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
        name: `${bm.name} anmeldelse`,
        itemReviewed: {
          '@type': 'Organization',
          name: bm.name,
          url: bm.url,
          ...(bm.ogImage?.url || bm.logoSquare?.url || bm.logo?.url
            ? { image: bm.ogImage?.url || bm.logoSquare?.url || bm.logo?.url }
            : {}),
        },
        reviewRating: bm.score != null
          ? { '@type': 'Rating', ratingValue: bm.score, bestRating: 10, worstRating: 1 }
          : undefined,
        author: author?.name
          ? {
              '@type': 'Person',
              name: author.name,
              ...(author.slug?.current ? { url: `${BASE}/redaktion/${author.slug.current}/` } : {}),
            }
          : { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
        publisher: {
          '@type': 'Organization',
          name: 'Slotsguiden',
          url: BASE,
          logo: { '@type': 'ImageObject', url: `${BASE}/logo.webp` },
        },
        ...(bm._createdAt ? { datePublished: (bm._createdAt as string).slice(0, 10) } : {}),
        ...(bm._updatedAt ? { dateModified: (bm._updatedAt as string).slice(0, 10) } : {}),
        url: canonical,
      },
    ],
  }

  return (
    <>
      <HreflangHead script={hreflangScript} />
      <JsonLd data={jsonLd} />
      <Navbar />

      <ReviewHero bm={bm} bonuses={relatedBonuses} />

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
