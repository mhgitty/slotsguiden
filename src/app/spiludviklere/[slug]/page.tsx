import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { SoftwareHero } from '@/components/SoftwareHero'
import { ComparisonTable } from '@/components/ComparisonTable'
import { CasinoComparisonTable } from '@/components/CasinoComparisonTable'
import { RelatedPages } from '@/components/RelatedPages'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { getSoftwareBySlug, client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const providers = await client.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "software" && (market == "global" || !defined(market)) && defined(slug.current)] { slug }`
  ).catch(() => [])
  return providers.map((p) => ({ slug: p.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const provider = await getSoftwareBySlug(slug).catch(() => null)
  if (!provider) return {}
  const title = replaceDateVars(provider.metaTitle || `${provider.name} onlinecasinoer — bedste ${provider.name}-casinoer`)
  const description = replaceDateVars(provider.metaDescription || `Find de bedste onlinecasinoer, der drives af ${provider.name}. Sammenlign bonusser og vurderinger.`)
  const canonical = `${BASE}/spiludviklere/${slug}/`
  const logo = provider.logo
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: 'article', images: logo?.url ? [{ url: logo.url }] : [{ url: `${BASE}/og.png` }] } }
}

export default async function SoftwareSlugPage({ params }: Props) {
  const { slug } = await params
  const provider = await getSoftwareBySlug(slug).catch(() => null)
  if (!provider) notFound()

  const canonical = `${BASE}/spiludviklere/${slug}/`

  // Comparison list: pinned casinos first (editor order), then any auto-matched
  // casino that isn't already pinned — deduped by _id.
  const seen = new Set<string>()
  const comparisonCasinos: any[] = []
  for (const c of [...((provider as any).pinnedCasinos ?? []), ...((provider as any).autoCasinos ?? [])]) {
    if (c?._id && !seen.has(c._id)) { seen.add(c._id); comparisonCasinos.push(c) }
  }
  const showComparison = (provider as any).showCasinoComparison !== false && comparisonCasinos.length > 0
  const comparisonTitle = replaceDateVars((provider as any).comparisonTitle || `Bedste casinoer med ${provider.name}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem',     item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Spiludviklere', item: `${BASE}/spiludviklere/` },
      { '@type': 'ListItem', position: 3, name: provider.name, item: canonical },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <HreflangLinks docId={(provider as any)._id} />
      <Navbar />

      {/* Breadcrumbs */}
      <div style={{ background: 'var(--bg-hero)', paddingTop: '32px', paddingBottom: '0' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 15px' }}>
          <Breadcrumbs crumbs={[
            { label: 'Hjem',     href: '/' },
            { label: 'Spiludviklere', href: '/spiludviklere/' },
            { label: provider.name },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <SoftwareHero
        name={provider.name}
        titel={replaceDateVars(provider.titel)}
        logo={provider.logo}
        rtp={provider.rtp}
        amountOfSlots={provider.amountOfSlots}
        licenses={provider.licenses}
        gameCategories={provider.gameCategories}
        highestRtpSlot={provider.highestRtpSlot}
        bonusBuys={provider.bonusBuys}
        intro={provider.intro}
      />

      {/* Casino comparison list — casinos that use this software provider */}
      {showComparison && (
        <div className="section" style={{ paddingBottom: (provider.body && provider.body.length > 0) ? '0' : undefined }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
            {comparisonTitle}
          </h2>
          <CasinoComparisonTable casinos={comparisonCasinos} maxVisible={(provider as any).comparisonLimit} moreLabel={(provider as any).comparisonMoreLabel || undefined} />
        </div>
      )}

      {/* Comparison table — configured on the CMS document in Sanity Studio */}
      {(provider as any).showComparisonTable && (provider as any).comparisonTable && (
        <div className="section" style={{ paddingBottom: (provider.body && provider.body.length > 0) ? '0' : undefined }}>
          {(provider as any).comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {replaceDateVars((provider as any).comparisonTableTitle)}
            </h2>
          )}
          <ComparisonTable data={(provider as any).comparisonTable} />
        </div>
      )}

      {/* Body content */}
      {provider.body && provider.body.length > 0 && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={provider.body} />
            <PortableTextRenderer value={provider.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={provider.body} />
          </aside>
        </div>
      )}

      <Footer />
      <RelatedPages docId={provider?._id} />
    </>
  )
}
