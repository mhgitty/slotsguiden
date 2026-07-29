import type { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'

export const revalidate = 86400

const BASE = 'https://slotsguiden.dk'

// Only include lastModified when we have a real timestamp — never fake it with new Date()
function lastMod(date?: string): { lastModified: Date } | Record<string, never> {
  return date ? { lastModified: new Date(date) } : {}
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages, bookmakers, paymentMethods, software, casinoGuides] = await Promise.all([

    client.fetch<Array<{ slug: { current: string }; publishedAt?: string; lastUpdated?: string }>>(
      `*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc) { slug, publishedAt, lastUpdated }`
    ).catch(() => []),

    client.fetch<Array<{ slug: { current: string }; a1?: string; a2?: string; a3?: string; a4?: string; _updatedAt?: string }>>(
      `*[_type == "page" && defined(slug.current)] {
        slug,
        "a1": parent->slug.current,
        "a2": parent->parent->slug.current,
        "a3": parent->parent->parent->slug.current,
        "a4": parent->parent->parent->parent->slug.current,
        _updatedAt
      }`
    ).catch(() => []),

    client.fetch<Array<{ slug: { current: string }; _updatedAt?: string }>>(
      `*[_type == "bookmaker" && defined(slug.current)] { slug, _updatedAt }`
    ).catch(() => []),

    client.fetch<Array<{ slug: { current: string }; _updatedAt?: string }>>(
      `*[_type == "paymentMethod" && defined(slug.current)] { slug, _updatedAt }`
    ).catch(() => []),

    client.fetch<Array<{ slug: { current: string }; _updatedAt?: string }>>(
      `*[_type == "software" && defined(slug.current)] { slug, _updatedAt }`
    ).catch(() => []),

    client.fetch<Array<{ slug: { current: string }; _updatedAt?: string }>>(
      `*[_type == "casinoGuide" && defined(slug.current)] { slug, _updatedAt }`
    ).catch(() => []),
  ])

  // ── Bookmaker review URLs ──────────────────────────────────────────────────────
  const bookmakerEntries: MetadataRoute.Sitemap = bookmakers.map((b) => ({
    url: `${BASE}/online-casino/${b.slug.current}/`,
    ...lastMod(b._updatedAt),
  }))

  // ── Page URLs ───────────────────────────────────────────────────────────────────
  const pageEntries: MetadataRoute.Sitemap = pages.map((p) => {
    const parts = [p.a4, p.a3, p.a2, p.a1, p.slug.current].filter(Boolean)
    return { url: `${BASE}/${parts.join('/')}/`, ...lastMod(p._updatedAt) }
  })

  // ── Payment method URLs ───────────────────────────────────────────────────────
  const paymentEntries: MetadataRoute.Sitemap = paymentMethods.map((m) => ({
    url: `${BASE}/betalingsmetoder/${m.slug.current}/`,
    ...lastMod(m._updatedAt),
  }))

  // ── Software URLs ──────────────────────────────────────────────────────────────
  const softwareEntries: MetadataRoute.Sitemap = software.map((s) => ({
    url: `${BASE}/spiludviklere/${s.slug.current}/`,
    ...lastMod(s._updatedAt),
  }))

  // ── Casino guide URLs ──────────────────────────────────────────────────────────
  const guideEntries: MetadataRoute.Sitemap = casinoGuides.map((g) => ({
    url: `${BASE}/casino-guides/${g.slug.current}/`,
    ...lastMod(g._updatedAt),
  }))

  return [
    // ── Root index pages (no fake lastmod) ──
    { url: `${BASE}/` },
    { url: `${BASE}/online-casino/` },
    { url: `${BASE}/betalingsmetoder/` },
    { url: `${BASE}/spiludviklere/` },
    { url: `${BASE}/casino-guides/` },

    // ── Dynamic content (real lastmod from Sanity _updatedAt) ──
    ...bookmakerEntries,
    ...paymentEntries,
    ...softwareEntries,
    ...guideEntries,
    ...posts.map((p) => ({
      url: `${BASE}/${p.slug.current}/`,
      ...lastMod(p.lastUpdated ?? p.publishedAt),
    })),
    ...pageEntries,
  ]
}
