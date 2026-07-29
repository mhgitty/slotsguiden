import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { JsonLd } from '@/components/JsonLd'
import { getPaymentMethodBySlug, client } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import Image from 'next/image'
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Betalingsmetoder', item: `${BASE}/betalingsmetoder/` },
        { '@type': 'ListItem', position: 3, name: heading, item: canonical },
      ] },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: heading, inLanguage: 'da-DK', publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE } },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      <div className="section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          {pm.logo?.url && (
            <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <Image src={pm.logo.url} alt={pm.logo.alt ?? heading} fill style={{ objectFit: 'contain' }} sizes="56px" />
            </div>
          )}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.4vw, 36px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, margin: 0 }}>
            {replaceDateVars(heading)}
          </h1>
        </div>
        {pm.intro && <PortableTextRenderer value={pm.intro} />}
      </div>

      {pm.body && (
        <div className="article-layout">
          <article className="article-content">
            <PortableTextRenderer value={pm.body} />
          </article>
        </div>
      )}

      <Footer />
    </>
  )
}
