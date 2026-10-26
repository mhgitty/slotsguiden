import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { MobileToc } from '@/components/MobileToc'
import { TableOfContents } from '@/components/TableOfContents'
import { JsonLd } from '@/components/JsonLd'
import { CampaignHero } from '@/components/hero/CampaignHero'
import { getBonusBySlug, client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { stripHtml } from '@/lib/sanitizeHtml'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'

export async function generateStaticParams() {
  const slugs = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "bonus" && defined(slug.current)]{ "slug": slug.current }`
  ).catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const b: any = await getBonusBySlug(slug).catch(() => null)
  if (!b) return {}
  const title = replaceDateVars(b.metaTitle || b.title)
  const description = replaceDateVars(b.metaDescription || stripHtml(b.terms) || '')
  const canonical = `${BASE}/casino-kampagner/${slug}/`
  const img = b.ogImage?.url || b.kampagneBillede?.url
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', images: img ? [{ url: img }] : [{ url: `${BASE}/og.webp` }] },
  }
}


export default async function BonusPage({ params }: Props) {
  const { slug } = await params
  const b: any = await getBonusBySlug(slug).catch(() => null)
  if (!b) notFound()

  const title = replaceDateVars(b.title)
  const casinoName = b.casinoNavn || b.bookmaker?.name || ''
  const logo = b.casinoLogoSquare?.url ? b.casinoLogoSquare : (b.bookmaker?.logoSquare?.url ? b.bookmaker.logoSquare : (b.casinoLogo?.url ? b.casinoLogo : b.bookmaker?.logo))
  const canonical = `${BASE}/casino-kampagner/${slug}/`

  // Auto-generated Offer schema for this bonus (mirrors the WordPress script).
  const offerDescription = replaceDateVars(b.metaDescription || stripHtml(b.terms) || '')
  const audienceType = b.schemaAudience || 'Existing customers'
  const offerSchema = {
    '@type': 'Offer',
    name: title,
    url: canonical,
    ...(offerDescription ? { description: offerDescription } : {}),
    ...(casinoName ? { seller: { '@type': 'Organization', name: casinoName } } : {}),
    itemOffered: {
      '@type': 'Service',
      name: title,
      ...(casinoName ? { provider: { '@type': 'Organization', name: casinoName } } : {}),
      areaServed: 'DK',
      audience: { '@type': 'PeopleAudience', audienceType },
    },
    eligibleCustomerType: 'http://purl.org/goodrelations/v1#Enduser',
    priceSpecification: { '@type': 'UnitPriceSpecification', price: 0, priceCurrency: 'DKK', valueAddedTaxIncluded: true },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Wagering', value: b.gennemspilskrav || '0x' },
      { '@type': 'PropertyValue', name: 'Minimum indbetaling', value: b.minimumIndbetaling != null ? `${b.minimumIndbetaling} kr.` : '0 kr.' },
    ],
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Casino kampagner', item: `${BASE}/casino-kampagner/` },
          { '@type': 'ListItem', position: 3, name: title, item: canonical },
        ],
      },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, inLanguage: 'da-DK', publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE } },
      offerSchema,
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      <CampaignHero b={b} title={title} casinoName={casinoName} logo={logo} />

      {/* Body */}
      {b.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={b.body} />
            <PortableTextRenderer value={b.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={b.body} />
          </aside>
        </div>
      )}

      <Footer />
    </>
  )
}
