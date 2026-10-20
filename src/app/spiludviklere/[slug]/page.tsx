import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { DirectoryHero } from '@/components/hero/DirectoryHero'
import { ComparisonTable } from '@/components/ComparisonTable'
import { CasinoComparisonTable } from '@/components/CasinoComparisonTable'
import { RelatedPages } from '@/components/RelatedPages'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { getSoftwareBySlug, getSlotsByProvider, client } from '@/lib/sanity'
import { SlotGrid } from '@/components/slot/SlotGrid'
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
  const slots: any[] = await getSlotsByProvider((provider as any)._id).catch(() => [])
  const demoCount = slots.filter((g) => g.hasDemo).length

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

      <DirectoryHero
        kind="software"
        name={provider.name}
        title={replaceDateVars((provider as any).titel || provider.name)}
        logo={provider.logo}
        intro={(provider as any).intro}
        stats={[
          { icon: 'graph-up', label: 'RTP', value: (provider as any).rtp },
          { icon: 'gamepad', label: 'Antal slots', value: (provider as any).amountOfSlots },
          { icon: 'shield-check', label: 'Licens', value: /spillemyndighed/i.test((provider as any).licenses || '') ? 'Spillemyndigheden' : (provider as any).licenses },
          { icon: 'cup-star', label: 'Højeste RTP-slot', value: (provider as any).highestRtpSlot },
          { icon: 'wallet-money', label: 'Bonus buys', value: (provider as any).bonusBuys },
        ]}
        cats={String((provider as any).gameCategories || '').split(',').map((c: string) => c.trim()).filter(Boolean)}
        topPick={showComparison ? comparisonCasinos[0] : null}
        casinoCount={comparisonCasinos.length}
        slotCount={slots.length}
        crumbs={[
          { label: 'Hjem', href: '/' },
          { label: 'Spiludviklere', href: '/spiludviklere/' },
          { label: provider.name },
        ]}
      />

      {/* Casino comparison list — casinos that use this software provider */}
      {showComparison && (
        <div className="section scroll-anchor" id="casino-liste" style={{ paddingBottom: (provider.body && provider.body.length > 0) ? '0' : undefined }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
            {comparisonTitle}
          </h2>
          <CasinoComparisonTable casinos={comparisonCasinos} maxVisible={(provider as any).comparisonLimit} moreLabel={(provider as any).comparisonMoreLabel || undefined} />
        </div>
      )}

      {/* Slots from this provider, linked via each slot's "Spiludvikler" field */}
      {slots.length > 0 && (
        <div className="section scroll-anchor" id="spil" style={{ paddingBottom: (provider.body && provider.body.length > 0) ? '0' : undefined }}>
          <div className="sgs-head">
            <h2>Spil fra {provider.name}</h2>
            <p>{slots.length} {slots.length === 1 ? 'spillemaskine' : 'spillemaskiner'} på Slotsguiden{demoCount > 0 ? ` · ${demoCount} med gratis demo` : ''}</p>
          </div>
          <SlotGrid games={slots} step={20} tools={slots.length > 20} showProvider={false} />
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
