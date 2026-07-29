import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PaymentMethodHero } from '@/components/PaymentMethodHero'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { MobileToc } from '@/components/MobileToc'
import { TableOfContents } from '@/components/TableOfContents'
import { CasinoComparisonTable } from '@/components/CasinoComparisonTable'
import { JsonLd } from '@/components/JsonLd'
import { getPaymentMethodBySlug, client } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'

export async function generateStaticParams() {
  const slugs = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "paymentMethod" && defined(slug.current)]{ "slug": slug.current }`
  ).catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pm: any = await getPaymentMethodBySlug(slug).catch(() => null)
  if (!pm) return {}
  const title = replaceDateVars(pm.metaTitle || pm.titel || pm.name)
  const description = replaceDateVars(pm.metaDescription || blocksToPlainText(pm.intro))
  const canonical = `${BASE}/betalingsmetoder/${slug}/`
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: 'article', images: pm.logo?.url ? [{ url: pm.logo.url }] : [{ url: `${BASE}/og.png` }] } }
}

export default async function PaymentMethodPage({ params }: Props) {
  const { slug } = await params
  const pm: any = await getPaymentMethodBySlug(slug).catch(() => null)
  if (!pm) notFound()
  const canonical = `${BASE}/betalingsmetoder/${slug}/`
  const heading = pm.titel || pm.name

  // Comparison list: pinned casinos first (editor order), then any auto-matched
  // casino that isn't already pinned — deduped by _id.
  const seen = new Set<string>()
  const comparisonCasinos: any[] = []
  for (const c of [...(pm.pinnedCasinos ?? []), ...(pm.autoCasinos ?? [])]) {
    if (c?._id && !seen.has(c._id)) { seen.add(c._id); comparisonCasinos.push(c) }
  }
  const showComparison = pm.showCasinoComparison !== false && comparisonCasinos.length > 0
  const comparisonTitle = replaceDateVars(pm.comparisonTitle || `Bedste casinoer med ${pm.name}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Betalingsmetoder', item: `${BASE}/betalingsmetoder/` },
        { '@type': 'ListItem', position: 3, name: pm.name || heading, item: canonical },
      ] },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: heading, inLanguage: 'da-DK', publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE } },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      {/* Breadcrumbs */}
      <div style={{ background: 'var(--bg-hero)', paddingTop: '32px', paddingBottom: '0' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 15px' }}>
          <Breadcrumbs crumbs={[
            { label: 'Hjem', href: '/' },
            { label: 'Betalingsmetoder', href: '/betalingsmetoder/' },
            { label: pm.name || heading },
          ]} />
        </div>
      </div>

      <PaymentMethodHero
        name={pm.name}
        titel={replaceDateVars(heading)}
        logo={pm.logo}
        paymentCategory={pm.paymentCategory}
        withdrawalTime={pm.withdrawalTime}
        transactionFees={pm.transactionFees}
        eligibleForBonuses={pm.eligibleForBonuses}
        intro={pm.intro}
      />

      {/* Casino comparison list — casinos supporting this payment method */}
      {showComparison && (
        <div className="section" style={{ paddingBottom: pm.body ? '0' : undefined }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
            {comparisonTitle}
          </h2>
          <CasinoComparisonTable casinos={comparisonCasinos} />
        </div>
      )}

      {pm.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={pm.body} />
            <PortableTextRenderer value={pm.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={pm.body} />
          </aside>
        </div>
      )}

      <Footer />
    </>
  )
}
