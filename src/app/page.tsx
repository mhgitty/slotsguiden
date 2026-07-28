import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CountryHero } from '@/components/CountryHero'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { HomeSections } from '@/components/HomeSections'
import { HreflangHead } from '@/components/HreflangHead'
import { AuthorBio } from '@/components/AuthorBio'
import { getHomepage, getSiteSettings, getHreflangScript } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

export async function generateMetadata(): Promise<Metadata> {
  const hp = await getHomepage().catch(() => null)
  const title = replaceDateVars(hp?.metaTitle || hp?.heroHeading || 'Find de bedste onlinecasinobonusser')
  const description = replaceDateVars(hp?.metaDescription || blocksToPlainText(hp?.intro) || 'Vi sammenligner og anmelder alle de bedste onlinecasinoer. Find den bedste velkomstbonus og kom i gang i dag.')
  const img = (hp as any)?.featuredImage?.url
  return {
    title,
    description,
    alternates: { canonical: BASE + '/' },
    openGraph: {
      title, description, url: BASE + '/', type: 'website',
      images: img ? [{ url: img }] : [{ url: `${BASE}/og.png` }],
    },
  }
}

export default async function HomePage() {
  const [hp, settings] = await Promise.all([
    getHomepage().catch(() => null),
    getSiteSettings().catch(() => null),
  ])

  const title = hp?.heroHeading || 'Find de bedste onlinecasinobonusser'
  const intro = hp?.intro ?? 'Vi sammenligner og anmelder alle de bedste onlinecasinoer. Find den bedste velkomstbonus og kom i gang i dag.'
  const author = settings?.defaultAuthor ?? null
  const heroCards = hp?.heroCards ?? []
  const hreflangScript = await getHreflangScript('homepage').catch(() => null)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', url: BASE + '/', name: 'Slotsguiden' },
      {
        '@type': 'WebPage',
        '@id': `${BASE}/#webpage`,
        url: BASE + '/',
        name: replaceDateVars(title),
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
      <CountryHero
        title={title}
        intro={intro}
        heroCards={heroCards}
        breadcrumbs={[{ label: 'Hjem', href: '/' }]}
      />

      {(hp?.sections?.length ?? 0) > 0 && (
        <HomeSections sections={hp!.sections} />
      )}

      {hp?.body && (
        <div className="section" style={{ paddingTop: 0 }}>
          <MobileToc body={hp.body} />
          <PortableTextRenderer value={hp.body} />
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
