import Link from 'next/link'
import Image from 'next/image'
import { getSiteSettings } from '@/lib/sanity'
import { SocialLinks, type SocialLinkData } from './SocialLinks'
import { LatestContentBlock } from './LatestContentBlock'
import { FooterNewsletter } from './FooterNewsletter'

function resolveUrl(item: {
  url?: string; pageSlug?: string; pageParentSlug?: string; pageParent2Slug?: string; pageParent3Slug?: string; pageParent4Slug?: string; pageMarket?: string;
  bookmakerSlug?: string; softwareSlug?: string; paymentMethodSlug?: string; postSlug?: string; casinoGuideSlug?: string;
}): string {
  if (item.pageSlug) {
    const segments = [item.pageParent4Slug, item.pageParent3Slug, item.pageParent2Slug, item.pageParentSlug, item.pageSlug].filter(Boolean)
    return `/${segments.join('/')}/`
  }
  if (item.bookmakerSlug) return `/online-casino/${item.bookmakerSlug}/`
  if (item.softwareSlug) return `/spiludviklere/${item.softwareSlug}/`
  if (item.paymentMethodSlug) return `/betalingsmetoder/${item.paymentMethodSlug}/`
  if (item.postSlug) return `/${item.postSlug}/`
  if (item.casinoGuideSlug) return `/guides/${item.casinoGuideSlug}/`
  return item.url || '/'
}

const DEFAULT_COLUMNS = [
  {
    title: 'Information',
    items: [
      { label: 'Om os',                url: '/om-oss' },
      { label: 'Ansvarligt spil', url: '/ansvarsfullt-spelande' },
      { label: 'Cookiepolitik',          url: '/cookiepolicy' },
      { label: 'Privatlivspolitik',     url: '/integritetspolicy' },
    ],
  },
  {
    title: 'Casinoanmeldelser',
    items: [
      { label: 'Alle casinoer', url: '/online-casino/' },
      { label: 'Bonusser',      url: '/online-casino/bonus/' },
    ],
  },
  {
    title: 'Guider & Artikler',
    items: [{ label: 'Blog', url: '/blog' }],
  },
  {
    title: 'Virksomhed',
    items: [{ label: 'Hjem', url: '/' }],
  },
]

interface FooterProps {
  tagline?: string
  columns?: any[]
  longDisclaimer?: string
  mediaLogos?: { alt: string; imageUrl?: string; url?: string }[]
  trustIcons?: { alt: string; imageUrl?: string; url?: string }[]
  note?: string
  disclaimer?: string
  bottomNav?: any[]
  socialLinks?: SocialLinkData | null
}

export async function Footer({
  tagline: taglineProp,
  columns: columnsProp,
  longDisclaimer: longDisclaimerProp,
  mediaLogos: mediaLogosProp,
  trustIcons: trustIconsProp,
  note: noteProp,
  disclaimer: disclaimerProp,
  bottomNav: bottomNavProp,
  socialLinks: socialLinksProp,
}: FooterProps = {}) {
  const year = new Date().getFullYear()

  const settings = await getSiteSettings().catch(() => null)
  const logoWhiteUrl = settings?.logoWhiteUrl ?? settings?.logoUrl ?? '/logo.webp'
  const tagline      = taglineProp      ?? settings?.footerTagline      ?? 'Din uafhængige danske guide til onlinecasinoer og casinobonusser. Vi sammenligner de bedste tilbud.'
  const columns      = columnsProp      ?? (settings?.footerColumns?.length ? settings.footerColumns : DEFAULT_COLUMNS)
  const longDisclaimer = longDisclaimerProp ?? settings?.footerLongDisclaimer ?? null
  const mediaLogos   = mediaLogosProp   ?? settings?.footerMediaLogos   ?? []
  const trustIcons   = trustIconsProp   ?? settings?.footerTrustIcons   ?? []
  const note         = noteProp         ?? settings?.footerNote         ?? `© ${year} Slotsguiden.dk · Spil ansvarligt · 18+`
  const disclaimer   = disclaimerProp   ?? settings?.footerDisclaimer   ?? 'Affiliatelinks kan forekomme · Se vilkår hos casinoet'
  const bottomNav    = bottomNavProp    ?? settings?.footerBottomNav    ?? []
  const socialLinks  = socialLinksProp  ?? settings?.socialLinks        ?? null

  const newsTitle = settings?.newsletterTitle || 'Få ugens bedste free spins i indbakken'
  const newsText  = settings?.newsletterText  || 'Én mail om ugen med nye bonusser og free spins. Ingen spam, og du kan altid framelde dig.'
  const rgText    = settings?.rgText || 'Har du brug for hjælp? Ring til StopSpillet på 70 22 28 25, eller udeluk dig selv via ROFUS.'
  // The responsible-gambling panel has its own 18+ badge, so skip an "18+" logo
  const rgLogos = (trustIcons || []).filter((i: { alt: string }) => i.alt.trim() !== '18+')

  return (
    <>
      <LatestContentBlock />
    <footer className="ft">
      <div className="ft-in">
        <FooterNewsletter title={newsTitle} text={newsText} />

        <div className="ft-main">
          <div className="ft-brand">
            <Image
              src={logoWhiteUrl}
              alt="Slotsguiden"
              height={32}
              width={180}
              style={{ height: '32px', width: 'auto', display: 'block' }}
              unoptimized={logoWhiteUrl.startsWith('http')}
            />
            <p>{tagline}</p>
            <SocialLinks links={socialLinks} />
            {/* Google "preferred sources" button (rendered by publisher.js loaded in <head>) */}
            <div className="ft-gpref">
              <div className="ft-gpref-label">Følg os på Google</div>
              <div {...{ 'google-add-preferred-source-btn': '' }} data-theme="dark" />
            </div>
          </div>

          {(columns || []).map((col: any) => (
            <nav key={col.title} className="ft-col" aria-label={col.title}>
              <div className="ft-col-title">{col.title}</div>
              <ul>
                {(col.items || []).map((item: any) => {
                  const href = resolveUrl(item)
                  return (
                    <li key={href + item.label}>
                      <Link href={href}>{String(item.label).trim()}</Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          ))}
        </div>

        {mediaLogos && mediaLogos.length > 0 && (
          <div className="ft-media">
            <div className="ft-col-title">Omtalt i</div>
            <div className="ft-media-row">
              {mediaLogos.map((logo: { alt: string; imageUrl?: string; url?: string }) => {
                const inner = logo.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={logo.imageUrl} alt={logo.alt} />
                  : <span>{logo.alt}</span>
                return logo.url
                  ? <a key={logo.alt} href={logo.url} target="_blank" rel="noopener noreferrer">{inner}</a>
                  : <div key={logo.alt}>{inner}</div>
              })}
            </div>
          </div>
        )}

        <div className="ft-rg">
          <div className="ft-rg-text">
            <span className="ft-rg-18" aria-hidden="true">18+</span>
            <div>
              <b>Spil ansvarligt</b>
              <small>{rgText}</small>
            </div>
          </div>
          {rgLogos.length > 0 && (
            <div className="ft-rg-logos">
              {rgLogos.map((icon: { alt: string; imageUrl?: string; url?: string }) => {
                const inner = icon.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={icon.imageUrl} alt={icon.alt} loading="lazy" />
                  : <span>{icon.alt}</span>
                return icon.url
                  ? <a key={icon.alt} href={icon.url} target="_blank" rel="noopener noreferrer">{inner}</a>
                  : <div key={icon.alt}>{inner}</div>
              })}
            </div>
          )}
        </div>

        {longDisclaimer && (
          <details className="ft-legal">
            <summary>Om vores anbefalinger <span aria-hidden="true">▾</span></summary>
            <p>{longDisclaimer}</p>
          </details>
        )}

        <div className="ft-bottom">
          <div className="ft-bottom-note">
            <span>{note}</span>
            {disclaimer && <span className="ft-bottom-disc">{disclaimer}</span>}
          </div>
          <nav className="ft-bottom-nav" aria-label="Om Slotsguiden">
            {(bottomNav || []).map((item: any) => {
              const href = resolveUrl(item)
              return <Link key={href + item.label} href={href}>{item.label}</Link>
            })}
            <span className="ft-18"><i>18+</i> Spil ansvarligt</span>
          </nav>
        </div>
      </div>
    </footer>
    </>
  )
}
