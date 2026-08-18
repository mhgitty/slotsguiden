import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { ComparisonTable } from '@/components/ComparisonTable'
import { AuthorBio } from '@/components/AuthorBio'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { RelatedPages } from '@/components/RelatedPages'
import { BonusGrid } from '@/components/BonusGrid'
import { SpillemaskinerArchive } from '@/components/SpillemaskinerArchive'
import { getPageBySlug, getSiteSettings, getSpillemaskiner } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'
const CANONICAL = `${BASE}/online-spillemaskiner/`
const SLUG = 'online-spillemaskiner'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG).catch(() => null)
  const title = replaceDateVars(page?.metaTitle || page?.title || 'Online spillemaskiner')
  const description = replaceDateVars(page?.metaDescription || blocksToPlainText(page?.intro))
  const ogImg = (page as any)?.ogImage
  return {
    title, description,
    alternates: { canonical: CANONICAL },
    openGraph: { title, description, url: CANONICAL, type: 'article', images: ogImg?.url ? [{ url: ogImg.url }] : [{ url: `${BASE}/og.png` }] },
  }
}

export default async function SpillemaskinerPage() {
  const [page, settings, games] = await Promise.all([
    getPageBySlug(SLUG).catch(() => null),
    getSiteSettings().catch(() => null),
    getSpillemaskiner().catch(() => [] as any[]),
  ])
  if (!page) notFound()
  const author = (page as any).author ?? settings?.defaultAuthor ?? null

  const crumbLabel = ((page.slug as any)?.current || SLUG).replace(/-/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase())

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: crumbLabel, item: CANONICAL },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${CANONICAL}#webpage`,
        url: CANONICAL,
        name: page.title,
        description: blocksToPlainText(page.intro),
        inLanguage: 'da-DK',
        publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <HreflangLinks docId={(page as any)?._id} />
      <Navbar />
      <HeroSection
        title={page.title}
        intro={page.intro}
        author={author}
        factChecker={page.factChecker}
        updatedAt={page.lastUpdated}
        breadcrumbs={[{ label: 'Hjem', href: '/' }, { label: crumbLabel }]}
      />

      {/* Games archive: first 20 + "show more" */}
      <SpillemaskinerArchive games={games as any[]} initialCount={20} />

      {page.showBonusGrid && <BonusGrid title={page.bonusGridTitle} />}

      {page.showComparisonTable && page.comparisonTable && (
        <div className="section" style={{ paddingBottom: page.body ? '0' : undefined }}>
          {page.comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {replaceDateVars(page.comparisonTableTitle)}
            </h2>
          )}
          <ComparisonTable data={page.comparisonTable} />
        </div>
      )}

      {page.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={page.body} />
            <PortableTextRenderer value={page.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={page.body} />
          </aside>
        </div>
      )}

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}

      <Footer />
      <RelatedPages docId={page?._id} />
    </>
  )
}
