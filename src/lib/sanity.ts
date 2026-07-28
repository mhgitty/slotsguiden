import { createClient } from 'next-sanity'
import { cache } from 'react'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
const apiVersion = '2026-04-22'

const publishedClient = createClient({ projectId, dataset, apiVersion, useCdn: true })
const publishedNoCdnClient = createClient({ projectId, dataset, apiVersion, useCdn: false })

// Draft (preview) client — reads unpublished drafts. Only active when a read
// token is set AND Next.js Draft Mode is enabled for the request.
const readToken = process.env.SANITY_API_READ_TOKEN
const draftClient = readToken
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, token: readToken, perspective: 'drafts' })
  : null

async function isPreview(): Promise<boolean> {
  if (!draftClient) return false
  try {
    const { draftMode } = await import('next/headers')
    return (await draftMode()).isEnabled
  } catch {
    return false // no request scope (e.g. build-time generateStaticParams)
  }
}

// Draft-aware clients. When Draft Mode is on they read drafts (fresh, no cache);
// otherwise they behave exactly like the published clients. Call sites use
// `.fetch(...)` unchanged. The draft fetch is fault-tolerant: on any error it
// logs the cause and falls back to the published client so preview never crashes.
async function draftAwareFetch<R>(
  fallback: (q: string, p: any, o: any) => Promise<R>,
  query: string,
  params: any,
  options: any
): Promise<R> {
  if (await isPreview()) {
    try {
      return await draftClient!.fetch<R>(query, params, { cache: 'no-store' })
    } catch (err) {
      console.error('[preview] draft fetch failed, falling back to published:', err)
      return fallback(query, params, options)
    }
  }
  return fallback(query, params, options)
}

export const client = {
  fetch: <R = any>(query: string, params: any = {}, options: any = {}): Promise<R> =>
    draftAwareFetch<R>((q, p, o) => publishedClient.fetch<R>(q, p, o), query, params, options),
}

export const clientNoCdn = {
  fetch: <R = any>(query: string, params: any = {}, options: any = {}): Promise<R> =>
    draftAwareFetch<R>((q, p, o) => publishedNoCdnClient.fetch<R>(q, p, o), query, params, options),
}

// ─── Hreflang ─────────────────────────────────────────────────────────────────
// Embed in any query as: "hreflangScript": ${HREFLANG_FRAGMENT}
// Uses a reverse reference lookup — finds any hreflangGroup that includes this doc.

export const HREFLANG_FRAGMENT = `*[_type == "hreflangGroup" && ^._id in pages[]._ref][0].script`

export async function getHreflangScript(docId: string): Promise<string | null> {
  return clientNoCdn.fetch(
    `*[_type == "hreflangGroup" && references($docId)][0].script`,
    { docId }
  )
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(limit = 20, categorySlug?: string) {
  const filter = categorySlug
    ? `*[_type == "post" && defined(publishedAt) && category->slug.current == $categorySlug]`
    : `*[_type == "post" && defined(publishedAt)]`

  return client.fetch(
    `${filter} | order(publishedAt desc) [0...$limit] {
      _id, title, slug, excerpt, publishedAt, readingTime,
      "featuredImage": featuredImage { "url": asset->url, alt },
      category-> { name, slug, emoji }
    }`,
    { limit, categorySlug: categorySlug ?? '' }
  )
}

export async function getPostBySlug(slug: string) {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id, title, slug, excerpt, publishedAt, lastUpdated, readingTime,
      "body": body[] {
        ...,
        _type == "casinoKortBlock" => {
          ...,
          customTitle, customBody, pros, cons,
          "imageUrl": image.asset->url,
          "bookmaker": bookmaker-> {
            name, score, url,
            "logoUrl": logo.asset->url,
            "logoAlt": logo.alt,
          }
        },
        _type == "bonusKortBlock" => {
          ...,
          customTitle, customBody,
          "imageUrl": image.asset->url,
          "bonus": bonus-> {
            "name": coalesce(bookmaker->name, casinoNavn, title),
            "bonusText": title,
            "logoUrl": coalesce(casinoLogo.asset->url, bookmaker->logo.asset->url),
            "logoAlt": coalesce(casinoLogo.alt, bookmaker->logo.alt),
            "score": bookmaker->score,
            "offerUrl": offerUrl,
            "terms": terms,
          }
        }
      },
      "featuredImage": featuredImage { "url": asset->url, alt },
      "ogImage": ogImage { "url": asset->url, alt },
      metaTitle, metaDescription,
      category-> { name, slug, emoji },
      author-> { name, slug, bio, linkedin, "imageUrl": image.asset->url }
    }`,
    { slug }
  )
}

// ─── Comparison table fragment ─────────────────────────────────────────────────
// Pages store showComparisonTable (bool) + comparisonTemplate (reference).
// We expand the reference inline so the frontend gets the same data shape.
const COMPARISON_TABLE_FRAGMENT = `
  showComparisonTable, comparisonTableTitle,
  "comparisonTable": comparisonTemplate-> {
    tableType,
    bonuses[]-> {
      _id, title, slug, active,
      oddsBonusTitel, minimumOdds, minimumIndbetaling, gennemspilskrav,
      offerUrl, terms, casinoNavn,
      "casinoLogo":      casinoLogo      { "url": asset->url, alt },
      "kampagneBillede": kampagneBillede { "url": asset->url, alt },
      "bookmaker": bookmaker-> { name, slug }
    },
    bookmakers[]-> {
      _id, name, slug, usp, score,
      indbetalingsbonus, minIndbetaling, gennemspilskrav,
      url, terms, market,
      "logo": logo { "url": asset->url, alt },
      "paymentMethods": paymentMethods[]-> {
        _id, name, "slug": slug.current,
        "logo": logo { "url": asset->url, alt }
      },
      "software": software[]-> {
        _id, name, "slug": slug.current,
        "logo": logo { "url": asset->url, alt }
      }
    }
  }
`

// ─── Pages ────────────────────────────────────────────────────────────────────

// Page fields shared by single and nested lookups
const PAGE_FIELDS = `
  _id, title, slug, intro, metaTitle, metaDescription,
  "body": body[] {
    ...,
    _type == "casinoKortBlock" => {
      ...,
      customTitle, customBody, pros, cons,
      "imageUrl": image.asset->url,
      "bookmaker": bookmaker-> {
        name, score, url,
        "logoUrl": logo.asset->url,
        "logoAlt": logo.alt,
      }
    },
    _type == "bonusKortBlock" => {
      ...,
      customTitle, customBody,
      "imageUrl": image.asset->url,
      "bonus": bonus-> {
        "name": coalesce(bookmaker->name, casinoNavn, title),
        "bonusText": coalesce(velkomstbonusTitel, oddsBonusTitel, indbetalingsbonusTitel, title),
        "logoUrl": coalesce(casinoLogo.asset->url, bookmaker->logo.asset->url),
        "logoAlt": coalesce(casinoLogo.alt, bookmaker->logo.alt),
        "score": bookmaker->score,
        "offerUrl": offerUrl,
        "terms": terms,
      }
    }
  },
  "a1Slug": parent->slug.current,
  "a1Title": parent->title,
  "a2Slug": parent->parent->slug.current,
  "a2Title": parent->parent->title,
  "a3Slug": parent->parent->parent->slug.current,
  "a3Title": parent->parent->parent->title,
  "a4Slug": parent->parent->parent->parent->slug.current,
  "a4Title": parent->parent->parent->parent->title,
  "featuredImage": featuredImage { "url": asset->url, alt },
  lastUpdated, hideAuthor,
  "author": author-> {
    name, slug, bio, linkedin, x, facebook,
    "imageUrl": image.asset->url
  },
  "factChecker": factChecker-> {
    name, slug, linkedin,
    "imageUrl": image.asset->url
  },
  ${COMPARISON_TABLE_FRAGMENT}
`

export async function getPageBySlug(slug: string) {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug && !defined(parent) && (market == "global" || !defined(market))][0] { ${PAGE_FIELDS} }`,
    { slug }
  )
}

/** Build a dynamic ancestor filter for any path depth (up to 5 levels) */
function buildAncestorFilter(segments: string[]): { conditions: string; params: Record<string, string> } {
  const reversed = [...segments].reverse() // [child, parent, grandparent, ...]
  const params: Record<string, string> = {}
  const conditions = reversed.map((seg, i) => {
    const key = `seg${i}`
    params[key] = seg
    return `${'parent->'.repeat(i)}slug.current == $${key}`
  })
  // Anchor the chain to the root: the topmost matched segment must itself have
  // no parent. Without this, a partial path matches a deeper page — e.g.
  // /bonus/no-deposit/ would match the page that actually lives at
  // /online-casino/bonus/no-deposit/, since only the immediate parent is checked.
  conditions.push(`!defined(${'parent->'.repeat(segments.length - 1)}parent)`)
  return { conditions: conditions.join(' && '), params }
}

/** Resolve a page by its full URL path — supports any depth up to 5 segments */
export async function getPageByPath(segments: string[]) {
  if (segments.length === 1) return getPageBySlug(segments[0])
  const { conditions, params } = buildAncestorFilter(segments)
  return client.fetch(
    `*[_type == "page" && ${conditions} && (market == "global" || !defined(market))][0] { ${PAGE_FIELDS} }`,
    params
  )
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return client.fetch(
    `*[_type == "category"] | order(name asc) { _id, name, slug, emoji, description }`
  )
}

// ─── Bookmakers ───────────────────────────────────────────────────────────────

export async function getBookmakers() {
  return clientNoCdn.fetch(
    `*[_type == "bookmaker" && (market == "global" || !defined(market))] | order(score desc, name asc) {
      _id, name, slug, usp, score,
      indbetalingsbonus, minIndbetaling,
      gennemspilskrav, url, terms,
      "logo": logo { "url": asset->url, alt }
    }`
  )
}

export async function getBookmakerBySlug(slug: string) {
  return clientNoCdn.fetch(
    `*[_type == "bookmaker" && slug.current == $slug && (market == "global" || !defined(market))][0] {
      _id, titel, name, slug, usp, score,
      indbetalingsbonus, minIndbetaling, gennemspilskrav,
      url, terms, lanceringsdato, license, body,
      "logo": logo { "url": asset->url, alt },
      "ogImage": ogImage { "url": asset->url, alt },
      metaTitle, metaDescription
    }`,
    { slug }
  )
}

// ─── Bonusser ─────────────────────────────────────────────────────────────────

export async function getBonuses(limit = 50) {
  return client.fetch(
    `*[_type == "bonus" && active == true && (market == "global" || !defined(market))] | order(_createdAt desc) [0...$limit] {
      _id, title, slug,
      oddsBonusTitel, minimumOdds, minimumIndbetaling, gennemspilskrav,
      offerUrl, terms, casinoNavn,
      "casinoLogo":    casinoLogo    { "url": asset->url, alt },
      "kampagneBillede": kampagneBillede { "url": asset->url, alt },
      "bookmaker": bookmaker-> { name, slug }
    }`,
    { limit }
  )
}

// Keep old name as alias for any existing usage
export const getBonusser = getBonuses

export async function getRecentBonuses(limit = 5) {
  return client.fetch(
    `*[_type == "bonus" && (market == "global" || !defined(market))] | order(coalesce(publishedAt, _createdAt) desc) [0...$limit] {
      _id, title, "date": coalesce(publishedAt, _createdAt),
      offerUrl, "bookmakerSlug": bookmaker->slug.current
    }`,
    { limit }
  )
}

export async function getBonusBySlug(slug: string) {
  return client.fetch(
    `*[_type == "bonus" && slug.current == $slug && (market == "global" || !defined(market))][0] {
      _id, title, slug, body, metaTitle, metaDescription,
      minimumOdds, minimumIndbetaling, gennemspilskrav,
      maksGevinst, bonuskode, spinVaerdi,
      offerUrl, terms, casinoNavn,
      "casinoLogo":      casinoLogo      { "url": asset->url, alt },
      "kampagneBillede": kampagneBillede { "url": asset->url, alt },
      "ogImage":         ogImage         { "url": asset->url, alt },
      "bookmaker": bookmaker-> {
        name, slug,
        "logo": logo { "url": asset->url, alt }
      }
    }`,
    { slug }
  )
}

// ─── Site settings (menus) ────────────────────────────────────────────────────
// Wrapped in React cache() so Navbar + Footer share one fetch per page render.

// ── Header nav projection (nested children → multi-level sub-menus) ──────────────
const navSlugFields = () =>
  `"pageSlug": pageRef->slug.current, "pageParentSlug": pageRef->parent->slug.current, "pageParent2Slug": pageRef->parent->parent->slug.current, "pageParent3Slug": pageRef->parent->parent->parent->slug.current, "pageParent4Slug": pageRef->parent->parent->parent->parent->slug.current, "bookmakerSlug": bookmakerRef->slug.current, "softwareSlug": softwareRef->slug.current, "paymentMethodSlug": paymentMethodRef->slug.current, "postSlug": postRef->slug.current, "casinoGuideSlug": casinoGuideRef->slug.current`
const navChildren = (depth: number): string =>
  depth <= 0 ? '' : `, children[] { label, url, ${navSlugFields()}${navChildren(depth - 1)} }`
const headerNavProjection = () =>
  `headerNav[] { label, url, isHighlighted, icon, ${navSlugFields()}${navChildren(3)} }`

export const getSiteSettings = cache(async () => {
  return client.fetch(
    `*[_type == "siteSettings"][0] {
      "logoUrl": logo.asset->url,
      "logoWhiteUrl": logoWhite.asset->url,
      "defaultAuthor": defaultAuthor-> {
        name, slug, bio, linkedin, x, facebook,
        "imageUrl": image.asset->url
      },
      ${headerNavProjection()},
      footerTagline,
      relatedPagesTitle,
      socialLinks,
      footerColumns[] {
        title,
        items[] {
          label, url,
          "pageSlug": pageRef->slug.current,
          "pageParentSlug": pageRef->parent->slug.current,
          "pageParent2Slug": pageRef->parent->parent->slug.current,
          "pageParent3Slug": pageRef->parent->parent->parent->slug.current,
          "pageParent4Slug": pageRef->parent->parent->parent->parent->slug.current,
          "bookmakerSlug": bookmakerRef->slug.current,
          "softwareSlug": softwareRef->slug.current,
          "paymentMethodSlug": paymentMethodRef->slug.current,
          "postSlug": postRef->slug.current, "casinoGuideSlug": casinoGuideRef->slug.current,
        }
      },
      footerLongDisclaimer,
      footerMediaLogos[] {
        alt,
        url,
        "imageUrl": image.asset->url
      },
      footerTrustIcons[] {
        alt,
        url,
        "imageUrl": image.asset->url
      },
      footerNote,
      footerDisclaimer,
      footerBottomNav[] {
        label, url,
        "pageSlug": pageRef->slug.current,
        "pageParentSlug": pageRef->parent->slug.current,
        "pageParent2Slug": pageRef->parent->parent->slug.current,
        "pageParent3Slug": pageRef->parent->parent->parent->slug.current,
        "pageParent4Slug": pageRef->parent->parent->parent->parent->slug.current,
        "bookmakerSlug": bookmakerRef->slug.current,
        "softwareSlug": softwareRef->slug.current,
        "paymentMethodSlug": paymentMethodRef->slug.current,
        "postSlug": postRef->slug.current, "casinoGuideSlug": casinoGuideRef->slug.current,
      }
    }`,
    {},
    { next: { revalidate: 3600 } }
  )
})

// ─── Homepage ─────────────────────────────────────────────────────────────────

export async function getHomepage() {
  return client.fetch(
    `*[_type == "homepage" && _id == "homepage"][0] {
      heroHeading, intro,
      "heroCards": heroCards[] { _key, title, icon, href },
      "body": body[] {
        ...,
        _type == "casinoKortBlock" => {
          ...,
          customTitle, customBody, pros, cons,
          "imageUrl": image.asset->url,
          "bookmaker": bookmaker-> {
            name, score, url,
            "logoUrl": logo.asset->url,
            "logoAlt": logo.alt,
          }
        },
        _type == "bonusKortBlock" => {
          ...,
          customTitle, customBody,
          "imageUrl": image.asset->url,
          "bonus": bonus-> {
            "name": coalesce(bookmaker->name, casinoNavn, title),
            "bonusText": title,
            "logoUrl": coalesce(casinoLogo.asset->url, bookmaker->logo.asset->url),
            "logoAlt": coalesce(casinoLogo.alt, bookmaker->logo.alt),
            "score": bookmaker->score,
            "offerUrl": offerUrl,
            "terms": terms,
          }
        }
      },
      "sections": sections[] {
        _type, _key,
        title, count, body, icon, buttonLabel, buttonUrl, style,
        intro,
        "items": items[] { _key, title, description, icon, href, "bullets": bullets[] }
      },
      metaTitle, metaDescription,
      "featuredImage": featuredImage { "url": asset->url, alt }
    }`
  )
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

export async function getPaymentMethods() {
  return client.fetch(
    `*[_type == "paymentMethod" && (market == "global" || !defined(market))] | order(name asc) {
      _id, name, slug, paymentCategory,
      transactionFees, withdrawalTime, eligibleForBonuses,
      "logo": logo { "url": asset->url, alt }
    }`
  )
}

export async function getPaymentMethodBySlug(slug: string) {
  return client.fetch(
    `*[_type == "paymentMethod" && slug.current == $slug && (market == "global" || !defined(market))][0] {
      _id, name, titel, slug, withdrawalTime,
      paymentCategory, transactionFees, eligibleForBonuses,
      metaTitle, metaDescription,
      "intro": intro[] { ..., _type == "image" => { ..., "url": asset->url } },
      "body": body[] { ..., _type == "image" => { ..., "url": asset->url } },
      "logo": logo { "url": asset->url, alt },
      "casinos": *[_type == "bookmaker" && references(^._id)] | order(score desc) {
        _id, name, slug, score, usp, url,
        "logo": logo { "url": asset->url, alt }
      }
    }`,
    { slug }
  )
}

// ─── Software ─────────────────────────────────────────────────────────────────

export async function getSoftwareProviders() {
  return client.fetch(
    `*[_type == "software" && (market == "global" || !defined(market))] | order(name asc) {
      _id, name, slug, rtp, amountOfSlots, gameCategories,
      "logo": logo { "url": asset->url, alt }
    }`
  )
}

export async function getSoftwareBySlug(slug: string) {
  return client.fetch(
    `*[_type == "software" && slug.current == $slug && (market == "global" || !defined(market))][0] {
      _id, name, titel, slug, metaTitle, metaDescription,
      rtp, amountOfSlots, licenses, gameCategories, highestRtpSlot, bonusBuys,
      "intro": intro[] { ..., _type == "image" => { ..., "url": asset->url } },
      "body": body[] { ..., _type == "image" => { ..., "url": asset->url } },
      "logo": logo { "url": asset->url, alt },
      "casinos": casinos[]-> {
        _id, name, slug, score, usp, url,
        "logo": logo { "url": asset->url, alt }
      },
      ${COMPARISON_TABLE_FRAGMENT}
    }`,
    { slug }
  )
}

// ─── Liga stillinger ──────────────────────────────────────────────────────────

export async function getLigaStillingerBySlug(slug: string) {
  return client.fetch(
    `*[_type == "ligaStillinger" && slug.current == $slug][0] {
      _id, title, leagueName, intro, slug, leagueId, seasonId,
      "logo": logo { "url": asset->url, alt },
      metaTitle, metaDescription, lastUpdated,
      body[] { ..., _type == "image" => { ..., "url": asset->url } }
    }`,
    { slug }
  )
}

export async function getLigaStillingerPaths() {
  return client.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "ligaStillinger" && defined(slug.current)] { slug }`
  ).catch(() => [])
}

// ─── Authors ──────────────────────────────────────────────────────────────────

export async function getAuthorBySlug(slug: string) {
  return clientNoCdn.fetch(
    `*[_type == "author" && slug.current == $slug][0] {
      _id, name, slug, role, bio, intro, education, expertise, linkedin, x, facebook,
      "imageUrl": image.asset->url,
      metaTitle, metaDescription,
      "body": body[] {
        ...,
        _type == "image" => { ..., "url": asset->url }
      }
    }`,
    { slug }
  )
}

export async function getReviewsByAuthor(authorId: string, limit = 20) {
  return client.fetch(
    `*[_type == "bookmaker" && defined(slug.current)] | order(_createdAt desc) [0...$limit] {
      _id, name, slug, usp, score, market,
      "logo": logo { "url": asset->url, alt }
    }`,
    { authorId, limit }
  )
}

export async function getPostsByAuthor(authorId: string, limit = 20) {
  return client.fetch(
    `*[_type == "post" && defined(publishedAt) && author._ref == $authorId]
     | order(publishedAt desc) [0...$limit] {
      _id, title, slug, excerpt, publishedAt, readingTime,
      "featuredImage": featuredImage { "url": asset->url, alt },
      category-> { name, slug, emoji }
    }`,
    { authorId, limit }
  )
}

export async function getAuthorPaths() {
  return clientNoCdn.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "author" && defined(slug.current)] { slug }`
  ).catch(() => [])
}

// ─── Casino Games ─────────────────────────────────────────────────────────────

const CASINO_GAME_FIELDS = `
  _id, name, titel, slug, market,
  "logo":    logo    { "url": asset->url, alt },
  "ogImage": ogImage { "url": asset->url, alt },
  "intro": intro[] { ..., _type == "image" => { ..., "url": asset->url } },
  "body":  body[]  { ..., _type == "image" => { ..., "url": asset->url } },
  metaTitle, metaDescription,
  "casinos": casinos[]-> {
    _id, name, slug, usp, url,
    "logo": logo { "url": asset->url, alt }
  }
`

export async function getCasinoGameBySlug(slug: string) {
  return client.fetch(
    `*[_type == "casinoGame" && slug.current == $slug && market == "global"][0] { ${CASINO_GAME_FIELDS} }`,
    { slug }
  )
}

// ─── Casino Guides ────────────────────────────────────────────────────────────

export async function getCasinoGuideBySlug(slug: string) {
  return client.fetch(
    `*[_type == "casinoGuide" && slug.current == $slug && (market == "global" || !defined(market))][0] { ${PAGE_FIELDS} }`,
    { slug }
  )
}

/** List of guides for the archive grid (light projection). */
export async function getCasinoGuides() {
  return client.fetch(
    `*[_type == "casinoGuide" && (market == "global" || !defined(market)) && defined(slug.current)] | order(title asc) {
      _id, title, "slug": slug.current, metaDescription, lastUpdated,
      "featuredImage": featuredImage { "url": asset->url, alt }
    }`
  )
}

// ─── Related pages (bottom-of-page internal linking) ──────────────────────────

export type RelatedItem = {
  _id: string
  _type: string
  title?: string
  name?: string
  /** Editor-supplied link text that overrides the target's own title. */
  label?: string
  slug?: { current?: string }
  a1?: string
  a2?: string
  a3?: string
  a4?: string
}

const RELATED_PROJECTION = `
  _id, _type, title, name, slug,
  "a1": parent->slug.current,
  "a2": parent->parent->slug.current,
  "a3": parent->parent->parent->slug.current,
  "a4": parent->parent->parent->parent->slug.current
`

/** Builds the public URL for a related item, based on its own type. */
export function relatedItemHref(item: RelatedItem): string {
  const slug = item.slug?.current
  if (!slug) return '/'
  switch (item._type) {
    case 'page': {
      const segments = [item.a4, item.a3, item.a2, item.a1, slug].filter(Boolean)
      return `/${segments.join('/')}/`
    }
    case 'casinoGuide':
      return `/casino-guides/${slug}/`
    case 'paymentMethod':
      return `/online-casino/payment/${slug}/`
    case 'software':
      return `/online-casino/software/${slug}/`
    case 'bonus':
      return `/online-casino/bonus/${slug}/`
    case 'bookmaker':
      return `/review/${slug}/`
    case 'casinoGame':
      return `/casino-games/${slug}/`
    case 'post':
      return `/${slug}/`
    default:
      return `/${slug}/`
  }
}

/**
 * Resolves the "Related pages" block for a document. Hand-picked only — nothing
 * is shown unless an editor adds entries. Each entry may carry a custom `label`.
 */
export const getRelatedContent = cache(async (
  docId: string,
  limit = 12
): Promise<{ title?: string; items: RelatedItem[] }> => {
  if (!docId) return { items: [] }

  const self = await client.fetch<{
    relatedTitle?: string
    related?: { ref?: string; label?: string }[]
  } | null>(
    `*[_id == $docId][0] {
      relatedTitle,
      "related": relatedPages[] {
        "ref": coalesce(page._ref, _ref),
        label
      }
    }`,
    { docId }
  )

  if (!self) return { items: [] }

  const title = self.relatedTitle
  const picked = (self.related || []).filter((r) => r?.ref)
  if (picked.length === 0) return { title, items: [] }

  const ids = picked.map((r) => r.ref!) as string[]
  const labelById = new Map(picked.map((r) => [r.ref!, r.label]))

  const rows: RelatedItem[] = await client.fetch(
    `*[_id in $ids && defined(slug.current)] { ${RELATED_PROJECTION} }`,
    { ids }
  )
  const byId = new Map(rows.map((r) => [r._id, r]))

  const items = ids
    .map((id) => {
      const row = byId.get(id)
      if (!row) return null
      const label = labelById.get(id)
      return label ? { ...row, label } : row
    })
    .filter(Boolean)
    .slice(0, Math.max(1, limit)) as RelatedItem[]

  return { title, items }
})

/** Resolves a hand-picked list of documents for the "Page links" body block. */
export const getLinkedPages = cache(async (ids: string[]): Promise<RelatedItem[]> => {
  const clean = (ids || []).filter(Boolean)
  if (clean.length === 0) return []

  const rows: RelatedItem[] = await client.fetch(
    `*[_id in $ids && defined(slug.current)] { ${RELATED_PROJECTION} }`,
    { ids: clean }
  )
  const byId = new Map(rows.map((r) => [r._id, r]))
  return clean.map((id) => byId.get(id)).filter(Boolean) as RelatedItem[]
})

// ─── Author lookup (for the callout / quote body block) ───────────────────────

export type QuoteAuthor = {
  _id: string
  name?: string
  role?: string
  slug?: { current?: string }
  imageUrl?: string
}

export const getAuthorById = cache(async (id: string): Promise<QuoteAuthor | null> => {
  if (!id) return null
  return client.fetch(
    `*[_type == "author" && _id == $id][0] {
      _id, name, role, slug, "imageUrl": image.asset->url
    }`,
    { id }
  )
})

// ─── Provider box (body block) ────────────────────────────────────────────────

export type ProviderBoxItem = {
  _id: string
  _type: 'paymentMethod' | 'software'
  name?: string
  slug?: { current?: string }
  logo?: { url?: string; alt?: string }
}

export async function getProviderBoxItems(opts: {
  provider: 'paymentMethod' | 'software'
  ids?: string[]
  limit?: number
}): Promise<ProviderBoxItem[]> {
  const type = opts.provider === 'software' ? 'software' : 'paymentMethod'
  const ids = (opts.ids || []).filter(Boolean)
  const projection = `_id, _type, name, slug, "logo": logo { "url": asset->url, alt }`

  if (ids.length > 0) {
    const rows: ProviderBoxItem[] = await client.fetch(
      `*[_id in $ids && _type in ["paymentMethod", "software"]] { ${projection} }`,
      { ids }
    )
    const byId = new Map(rows.map((r) => [r._id, r]))
    return ids.map((id) => byId.get(id)).filter(Boolean) as ProviderBoxItem[]
  }

  const limit = Math.max(1, Math.min(opts.limit || 6, 24))
  return client.fetch(
    `*[_type == $type && (market == "global" || !defined(market))] | order(name asc) [0...$limit] { ${projection} }`,
    { type, limit }
  )
}

