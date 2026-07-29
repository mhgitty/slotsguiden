import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { JsonLd } from '@/components/JsonLd'
import { Icon } from '@/components/Icon'
import { getBonusBySlug, client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'

function formatExpiry(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}-${d.getFullYear()}`
}

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
  const description = replaceDateVars(b.metaDescription || b.terms || '')
  const canonical = `${BASE}/casino-kampagner/${slug}/`
  const img = b.ogImage?.url || b.kampagneBillede?.url
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', images: img ? [{ url: img }] : [{ url: `${BASE}/og.png` }] },
  }
}

function Stat({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Icon name={icon} size={20} color="var(--green)" />
      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

export default async function BonusPage({ params }: Props) {
  const { slug } = await params
  const b: any = await getBonusBySlug(slug).catch(() => null)
  if (!b) notFound()

  const title = replaceDateVars(b.title)
  const casinoName = b.casinoNavn || b.bookmaker?.name || ''
  const expiry = formatExpiry(b.kampagneSlut)
  const logo = b.casinoLogoSquare?.url ? b.casinoLogoSquare : (b.casinoLogo?.url ? b.casinoLogo : b.bookmaker?.logo)
  const canonical = `${BASE}/casino-kampagner/${slug}/`

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
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      <div className="section">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.4vw, 36px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: '20px' }}>
          {title}
        </h1>

        {/* Hero card */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--bg-card)', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'center' }}>

            {/* Left: campaign image + caption */}
            <div>
              {b.kampagneBillede?.url && b.kampagneBillede.w && b.kampagneBillede.h ? (
                <Image src={b.kampagneBillede.url} alt={b.kampagneBillede.alt ?? title} width={b.kampagneBillede.w} height={b.kampagneBillede.h} sizes="(max-width: 768px) 100vw, 500px" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }} />
              ) : b.kampagneBillede?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.kampagneBillede.url} alt={b.kampagneBillede.alt ?? title} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }} />
              ) : null}
              {(casinoName || expiry) && (
                <div style={{ fontSize: '12.5px', color: 'var(--text-faint)', textAlign: 'center', marginTop: '10px' }}>
                  {casinoName ? `En bonus fra ${casinoName}` : ''}{casinoName && expiry ? ' — ' : ''}{expiry ? `tilbuddet gælder indtil d. ${expiry}` : ''}
                </div>
              )}
            </div>

            {/* Right: logo + stats + CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap' }}>
                {logo?.url && (
                  <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <Image src={logo.url} alt={logo.alt ?? casinoName} fill style={{ objectFit: 'cover' }} sizes="64px" />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Stat icon="wallet" label="Min. indbetaling" value={b.minimumIndbetaling != null ? `${b.minimumIndbetaling} kr.` : '—'} />
                  <Stat icon="refresh-circle" label="Omsætningskrav" value={b.gennemspilskrav || '—'} />
                  <Stat icon="cup-star" label="Maks gevinst" value={b.maksGevinst || '∞'} />
                </div>
              </div>
              <a href={b.offerUrl || '#'} target="_blank" rel="nofollow sponsored noopener"
                 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--btn)', color: '#fff', fontWeight: 700, fontSize: '16px', padding: '16px', borderRadius: '10px', textDecoration: 'none' }}>
                Få bonus nu <Icon name="alt-arrow-right" size={16} color="#fff" />
              </a>
            </div>
          </div>

          {/* Terms */}
          {b.terms && (
            <p style={{ fontSize: '11.5px', color: 'var(--text-faint)', lineHeight: 1.6, marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-faint)' }}>{b.terms}</p>
          )}
        </div>
      </div>

      {/* Body */}
      {b.body && (
        <div className="article-layout">
          <article className="article-content">
            <PortableTextRenderer value={b.body} />
          </article>
        </div>
      )}

      <Footer />
    </>
  )
}
