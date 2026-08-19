import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { buildHeroQuickLinks } from '@/lib/heroQuickLinks'
import { ComparisonTable } from '@/components/ComparisonTable'
import { AuthorBio } from '@/components/AuthorBio'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { MobileToc } from '@/components/MobileToc'
import { getPageBySlug, getSiteSettings } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'
const CANONICAL = `${BASE}/betting-sider/`

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('betting-sider').catch(() => null)
  const title = replaceDateVars(page?.metaTitle || page?.title || 'Bedste casinoanmeldelser')
  const description = replaceDateVars(page?.metaDescription || page?.intro || 'Sammenlign de bedste onlinecasinoer.')
  return { title, description, alternates: { canonical: CANONICAL } }
}

export default async function BettingSiderPage() {
  const [page, settings] = await Promise.all([
    getPageBySlug('betting-sider').catch(() => null),
    getSiteSettings().catch(() => null),
  ])
  const author = (page as any)?.author ?? settings?.defaultAuthor ?? null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: page?.title || 'Casinoanmeldelser', item: CANONICAL },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${CANONICAL}#webpage`,
        url: CANONICAL,
        name: page?.title || 'Casinoanmeldelser',
        description: page?.intro || '',
        inLanguage: 'da-DK',
        publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
      },
    ],
  }

  if (!page) {
    return (
      <>
        <Navbar />
        <HeroSection
        title="Casinoanmeldelser"
        intro="Oversigt over alle casinoanmeldelser."
        breadcrumbs={[{ label: 'Hjem', href: '/' }, { label: 'Casinoanmeldelser' }]}
      />
        {author && (
          <div className="section" style={{ paddingTop: '0' }}>
            <AuthorBio author={author} compact />
          </div>
        )}
        <Footer />
      </>
    )
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <HreflangLinks docId={(page as any)?._id} />
      <Navbar />
      <HeroSection
        title={page.title}
        quickLinks={buildHeroQuickLinks(page)}
        intro={page.intro}
        author={author}
        updatedAt={(page as any).lastUpdated ?? null}
        factChecker={(page as any).factChecker ?? null}
        breadcrumbs={[{ label: 'Hjem', href: '/' }, { label: page.title }]}
      />

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
    </>
  )
}
