// This static route takes priority over [...slug] for /betalingsmetoder/.
// It renders the Sanity page at that path (same as [...slug] would) but injects
// the payment methods grid between the hero and body content.

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
import { PaymentMethodsGrid } from '@/components/PaymentMethodsGrid'
import { RelatedPages } from '@/components/RelatedPages'
import { getPageByPath, getPaymentMethods, getSiteSettings } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'
const SLUG = ['betalingsmetoder']
const CANONICAL = `${BASE}/betalingsmetoder/`

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageByPath(SLUG).catch(() => null)
  if (!page) return {}
  const title = replaceDateVars(page.metaTitle || page.title)
  const description = replaceDateVars(page.metaDescription || page.intro || '')
  return { title, description, alternates: { canonical: CANONICAL } }
}

export default async function PaymentMethodsIndexPage() {
  const [page, methods, settings] = await Promise.all([
    getPageByPath(SLUG).catch(() => null),
    getPaymentMethods().catch(() => []),
    getSiteSettings().catch(() => null),
  ])
  if (!page) notFound()
  const author = page.author ?? settings?.defaultAuthor ?? null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem',            item: BASE },
          { '@type': 'ListItem', position: 2, name: page.title,        item: CANONICAL },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${CANONICAL}#webpage`,
        url: CANONICAL,
        name: page.title,
        description: page.intro || '',
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
        breadcrumbs={[
          { label: 'Hjem', href: '/' },
          { label: page.title },
        ]}
      />

      {/* Payment methods overview grid */}
      {(methods as any[]).length > 0 && (
        <div className="section" style={{ paddingBottom: page.body ? '0' : undefined }}>
          <PaymentMethodsGrid
            methods={methods as any[]}
            hrefPrefix="/betalingsmetoder"
          />
        </div>
      )}

      {/* Comparison table */}
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

      {/* Body content */}
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
