import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { MobileToc } from '@/components/MobileToc'
import { TableOfContents } from '@/components/TableOfContents'
import { JsonLd } from '@/components/JsonLd'
import { getSpillemaskineBySlug, client } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'

export async function generateStaticParams() {
  const items = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "spillemaskine" && defined(slug.current)]{ "slug": slug.current }`
  ).catch(() => [])
  return items.map((s) => ({ slug: s.slug }))
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const g: any = await getSpillemaskineBySlug(slug).catch(() => null)
  if (!g) return {}
  const title = replaceDateVars(g.metaTitle || g.titel || g.name)
  const description = replaceDateVars(g.metaDescription || blocksToPlainText(g.intro) || blocksToPlainText(g.body))
  const canonical = `${BASE}/online-spillemaskiner/${slug}/`
  const img = g.ogImage?.url || g.featuredImage?.url
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', images: img ? [{ url: img }] : [{ url: `${BASE}/og.png` }] },
  }
}

export default async function SpillemaskinePage({ params }: Props) {
  const { slug } = await params
  const g: any = await getSpillemaskineBySlug(slug).catch(() => null)
  if (!g) notFound()

  const heading = replaceDateVars(g.titel || g.name)
  const canonical = `${BASE}/online-spillemaskiner/${slug}/`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Online spillemaskiner', item: `${BASE}/online-spillemaskiner/` },
          { '@type': 'ListItem', position: 3, name: g.name, item: canonical },
        ],
      },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: heading, inLanguage: 'da-DK', publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE } },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border)', padding: '28px 15px 36px' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
          <Breadcrumbs crumbs={[
            { label: 'Hjem', href: '/' },
            { label: 'Online spillemaskiner', href: '/online-spillemaskiner/' },
            { label: g.name },
          ]} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.6vw, 38px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, letterSpacing: '-0.03em', margin: '10px 0 0' }}>
            {heading}
          </h1>
          {g.intro && g.intro.length > 0 && (
            <div style={{ marginTop: '14px', maxWidth: '820px', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7 }}>
              <PortableTextRenderer value={g.intro} />
            </div>
          )}
        </div>
      </div>

      {g.body && g.body.length > 0 && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={g.body} />
            <PortableTextRenderer value={g.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={g.body} />
          </aside>
        </div>
      )}

      <Footer />
    </>
  )
}
