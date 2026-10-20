import { getSiteSettings } from '@/lib/sanity'
import { SiteHeader } from './header/SiteHeader'
import type { NavItem, NavLink, HeaderCta } from './header/types'

const DEFAULT_NAV = [
  { label: 'Hjem',               url: '/',                       isHighlighted: false, children: [] },
  { label: 'Casinoanmeldelser', url: '/online-casino/',                isHighlighted: false, children: [] },
  { label: 'Bonusser',           url: '/online-casino/bonus/',   isHighlighted: false, children: [] },
  { label: 'Guider & Artikler', url: '/blog/',                  isHighlighted: false, children: [] },
]

const DEFAULT_CTA: HeaderCta = { label: 'Top 10 casinoer', href: '/online-casino/' }

function resolveUrl(item: {
  url?: string; pageSlug?: string; pageParentSlug?: string; pageParent2Slug?: string; pageParent3Slug?: string; pageParent4Slug?: string;
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

const mapLink = (n: any): NavLink => ({
  label: n.label,
  href: resolveUrl(n),
  description: n.description || undefined,
  icon: n.icon || undefined,
  children: (n.children || []).map(mapLink),
})

export async function Navbar({ navItems }: { navItems?: NavItem[]; logoHref?: string } = {}) {
  const settings = await getSiteSettings().catch(() => null)
  let nav = navItems
  if (!nav) {
    const raw: any[] = settings?.headerNav?.length ? settings.headerNav : DEFAULT_NAV
    nav = raw.map((item: any): NavItem => ({
      label: item.label,
      href: resolveUrl(item),
      icon: item.icon ?? undefined,
      isHighlighted: item.isHighlighted ?? false,
      featuredLabel: item.featuredLabel ?? undefined,
      panelNote: item.panelNote ?? undefined,
      featured: item.featured?._id ? item.featured : null,
      children: (item.children || []).map(mapLink),
    }))
  }
  const cta: HeaderCta = settings?.headerCta?.label
    ? { label: settings.headerCta.label, href: settings.headerCta.url || DEFAULT_CTA.href }
    : DEFAULT_CTA

  return <SiteHeader nav={nav} cta={cta} />
}
