import Link from 'next/link'
import Image from 'next/image'
import { getSiteSettings } from '@/lib/sanity'
import { SocialLinks, type SocialLinkData } from './SocialLinks'
import { LatestContentBlock } from './LatestContentBlock'

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

  return (
    <>
      <LatestContentBlock />
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-footer)', marginTop: '80px' }}>

      {/* ════════════════════════════════════════
          SECTION 1 — Logo + link columns
          (spread evenly across full width)
      ════════════════════════════════════════ */}
      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '56px 24px 48px' }}>

        {/* Logo + tagline + columns in one flex row */}
        <div className="footer-cols-row">

          {/* Logo + tagline */}
          <div className="footer-col-logo">
            <div style={{ marginBottom: '14px' }}>
              <Image
                src={logoWhiteUrl}
                alt="Slotsguiden"
                height={32}
                width={180}
                style={{ height: '32px', width: 'auto', display: 'block' }}
                unoptimized={logoWhiteUrl.startsWith('http')}
              />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              {tagline}
            </p>
            <SocialLinks links={socialLinks} />
          </div>

          {/* Link columns — each gets equal space */}
          {(columns || []).map((col: any) => (
            <div key={col.title} className="footer-col">
              <div style={{
                fontSize: '11px', fontWeight: 700,
                color: 'var(--text-faint)',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                marginBottom: '14px',
              }}>
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(col.items || []).map((item: any) => {
                  const href = resolveUrl(item)
                  return (
                    <Link
                      key={href + item.label}
                      href={href}
                      style={{ fontSize: '13.5px', color: 'var(--text-muted)', textDecoration: 'none' }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── "As mentioned in" logos — above the divider ── */}
        {mediaLogos && mediaLogos.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)',
              textTransform: 'uppercase', letterSpacing: '0.8px',
              textAlign: 'center', marginBottom: '20px',
            }}>
              Omtalt i
            </div>
            <div className="footer-logos-row">
              {mediaLogos.map((logo: { alt: string; imageUrl?: string; url?: string }) => {
                const inner = (
                  <div key={logo.alt} className="footer-media-logo-card">
                    {logo.imageUrl ? (
                      <img
                        src={logo.imageUrl}
                        alt={logo.alt}
                        style={{ maxHeight: '28px', maxWidth: '120px', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain', opacity: 0.65, filter: 'grayscale(1) brightness(2)' }}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '-0.02em' }}>
                        {logo.alt}
                      </span>
                    )}
                  </div>
                )
                return logo.url ? (
                  <a key={logo.alt} href={logo.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flex: 1 }}>
                    {inner}
                  </a>
                ) : <div key={logo.alt} style={{ display: 'flex', flex: 1 }}>{inner}</div>
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* ════════════════════════════════════════
          SECTION 2 — Disclaimer + trust icons
      ════════════════════════════════════════ */}
      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Disclaimer text */}
        {longDisclaimer && (
          <p style={{
            fontSize: '12.5px', color: 'var(--text-faint)', lineHeight: 1.7,
            maxWidth: '860px', margin: '0 auto 36px', textAlign: 'center',
          }}>
            {longDisclaimer}
          </p>
        )}

        {/* Trust icons — spread evenly across full width */}
        {trustIcons && trustIcons.length > 0 && (
          <div className="footer-trust-row">
            {trustIcons.map((icon: { alt: string; imageUrl?: string; url?: string }) => {
              const inner = icon.imageUrl ? (
                <img
                  key={icon.alt}
                  src={icon.imageUrl}
                  alt={icon.alt}
                  style={{ height: '44px', width: 'auto', display: 'block', opacity: 0.75 }}
                />
              ) : (
                <span key={icon.alt} style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)',
                  border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 12px',
                  textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                }}>
                  {icon.alt}
                </span>
              )
              return icon.url ? (
                <a key={icon.alt} href={icon.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  {inner}
                </a>
              ) : (
                <div key={icon.alt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  {inner}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{
          maxWidth: '1250px', margin: '0 auto',
          padding: '18px 24px',
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center',
          gap: '10px',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>{note}</p>
            {disclaimer && (
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', margin: 0 }}>{disclaimer}</p>
            )}
          </div>

          {/* Right: bottom nav */}
          <div className="footer-bottom-right" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            {bottomNav && bottomNav.length > 0 && (
              <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {bottomNav.map((item: any) => {
                  const href = resolveUrl(item)
                  return (
                    <Link
                      key={href + item.label}
                      href={href}
                      style={{ fontSize: '12px', color: 'var(--text-faint)', textDecoration: 'none' }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>
        </div>
      </div>

    </footer>
    </>
  )
}
