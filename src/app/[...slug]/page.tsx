import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { ComparisonTable } from '@/components/ComparisonTable'
import { AuthorBio } from '@/components/AuthorBio'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { HreflangHead } from '@/components/HreflangHead'
import { RelatedPages } from '@/components/RelatedPages'
import { getPageByPath, getSiteSettings, getHreflangScript } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

interface Props { params: Promise<{ slug: string[] }> }

function buildPath(segments: string[]) {
  return '/' + segments.join('/') + '/'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageByPath(slug).catch(() => null)
  if (!page) return {}
  const title = replaceDateVars(page.metaTitle || page.title)
  const description = replaceDateVars(page.metaDescription || blocksToPlainText(page.intro))
  const canonical = `${BASE}${buildPath(slug)}`
  const ogImg = (page as any).ogImage
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: 'article', images: ogImg?.url ? [{ url: ogImg.url }] : [{ url: `${BASE}/og.png` }] } }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params
  const [page, settings] = await Promise.all([
    getPageByPath(slug).catch(() => null),
    getSiteSettings().catch(() => null),
  ])
  if (!page) notFound()
  const hreflangScript = await getHreflangScript(page._id).catch(() => null)
  const author = page.author ?? settings?.defaultAuthor ?? null

  const canonical = `${BASE}${buildPath(slug)}`

  const slugLabel = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())
  const breadcrumbItems = [
    { name: 'Hjem', item: BASE },
    ...slug.slice(0, -1).map((seg, idx) => ({
      name: slugLabel(seg),
      item: `${BASE}/${slug.slice(0, idx + 1).join('/')}/`,
    })),
    { name: slugLabel(slug[slug.length - 1]), item: canonical },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, i) => ({
          '@type': 'ListItem', position: i + 1, name: item.name, item: item.item,
        })),
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: blocksToPlainText(page.intro),
        inLanguage: 'da-DK',
        publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
      },
    ],
  }

  return (
    <>
      <HreflangHead script={hreflangScript} />
      <JsonLd data={jsonLd} />
      <Navbar />
      <HeroSection
        title={page.title}
        intro={page.intro}
        author={author}
        factChecker={page.factChecker}
        updatedAt={page.lastUpdated}
        breadcrumbs={[
          { label: 'Hjem', href: '/' },
          ...slug.slice(0, -1).map((seg, idx) => ({
            label: slugLabel(seg),
            href: `/${slug.slice(0, idx + 1).join('/')}/`,
          })),
          { label: slugLabel(slug[slug.length - 1]) },
        ]}
      />

      {/* Comparison table — configured per page in Sanity Studio */}
      {page.showComparisonTable && page.comparisonTable && (
        <div className="section" style={{ paddingBottom: page.body ? '0' : undefined }}>
          {page.comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {page.comparisonTableTitle}
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
