// Google News: which posts count as news.
// A category counts as news when "Nyhedskategori" is ticked in Studio, or when
// its slug is "nyheder" / "news" (so the existing Nyheder category works as-is).
export const NEWS_SLUGS = ['nyheder', 'news']

export function isNewsCategory(cat?: { isNews?: boolean; slug?: { current?: string } | string } | null): boolean {
  if (!cat) return false
  const slug = typeof cat.slug === 'string' ? cat.slug : cat.slug?.current
  return !!cat.isNews || (!!slug && NEWS_SLUGS.includes(slug))
}

/** GROQ filter for posts in a news category. */
export const NEWS_POST_FILTER = `_type == "post" && defined(slug.current) && defined(publishedAt) && (category->isNews == true || category->slug.current in ${JSON.stringify(NEWS_SLUGS)})`

/** Google wants several aspect ratios (16:9, 4:3, 1:1), at least 1200 px wide. */
export function articleImages(rawUrl?: string | null): string[] | undefined {
  if (!rawUrl) return undefined
  return [
    [1200, 675],
    [1200, 900],
    [1200, 1200],
  ].map(([w, h]) => `${rawUrl}?w=${w}&h=${h}&fit=crop&auto=format&q=80`)
}
