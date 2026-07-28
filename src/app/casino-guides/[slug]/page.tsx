import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { AuthorBio } from '@/components/AuthorBio'
import { ComparisonTable } from '@/components/ComparisonTable'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { getCasinoGuideBySlug, getSiteSettings, client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RelatedPages } from '@/components/RelatedPages'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const guides = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "casinoGuide" && (market == "global" || !defined(market)) && defined(slug.current)]{ "slug": slug.current }`
  ).catch(() => [])
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = await getCasinoGuideBySlug(slug).catch(() => null)
  if (!guide) return {}
  const canonical = `${BASE}/casino-guides/${slug}/`
  const title = replaceDateVars(guide.metaTitle || guide.title)
  const description = replaceDateVars(guide.metaDescription || guide.intro || '')
  const ogImg = (guide as any).featuredImage
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', images: ogImg?.url ? [{ url: ogImg.url }] : [{ url: `${BASE}/og.png` }] },
  }
}

export default async function CasinoGuidePage({ params }: Props) {
  const { slug } = await params
  const [guide, settings] = await Promise.all([
    getCasinoGuideBySlug(slug).catch(() => null),
    getSiteSettings().catch(() => null),
  ])
  if (!guide) notFound()

  const canonical = `${BASE}/casino-guides/${slug}/`
  const hideAuthor = (guide as any).hideAuthor ?? false
  const author = hideAuthor ? null : ((guide as any).author ?? settings?.defaultAuthor ?? null)
  const factChecker = hideAuthor ? null : ((guide as any).factChecker ?? null)

  const breadcrumbs = [
    { label: 'Hjem', href: '/' },
    { label: 'Casinoguider', href: '/casino-guides/' },
    { label: guide.title },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((c, i) => ({
          '@type': 'ListItem', position: i + 1, name: c.label,
          ...(c.href ? { item: `${BASE}${c.href}` } : {}),
        })),
      },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: replaceDateVars(guide.title), inLanguage: 'da-DK', publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE } },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <HreflangLinks docId={(guide as any)._id} />
      <Navbar />
      <HeroSection
        title={guide.title}
        intro={(guide as any).intro ?? undefined}
        author={author}
        factChecker={factChecker}
        updatedAt={(guide as any).lastUpdated ?? null}
        breadcrumbs={breadcrumbs}
      />

      {(guide as any).showComparisonTable && (guide as any).comparisonTable && (
        <div className="section" style={{ paddingBottom: guide.body ? '0' : undefined }}>
          {(guide as any).comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {replaceDateVars((guide as any).comparisonTableTitle)}
            </h2>
          )}
          <ComparisonTable data={(guide as any).comparisonTable} />
        </div>
      )}

      {guide.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={guide.body} />
            <PortableTextRenderer value={guide.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={guide.body} />
          </aside>
        </div>
      )}

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}
      <Footer />
      <RelatedPages docId={guide?._id} />

    </>
  )
}
