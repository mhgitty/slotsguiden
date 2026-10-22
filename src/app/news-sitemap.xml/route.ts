import { client } from '@/lib/sanity'
import { NEWS_POST_FILTER } from '@/lib/news'
import { replaceDateVars } from '@/lib/dateVars'

// Google News sitemap: news posts from the last 2 days (Google ignores older
// ones in a news sitemap; they stay in the normal sitemap.xml).
export const revalidate = 900

const BASE = 'https://slotsguiden.dk'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export async function GET() {
  const since = new Date(Date.now() - 2 * 86400000).toISOString()
  const posts: { slug: string; title: string; publishedAt: string }[] = await client
    .fetch(
      `*[${NEWS_POST_FILTER} && publishedAt >= $since && publishedAt <= now()] | order(publishedAt desc)[0...1000] { "slug": slug.current, title, publishedAt }`,
      { since }
    )
    .catch(() => [])

  const items = posts.map((p) => `  <url>
    <loc>${BASE}/${esc(p.slug)}/</loc>
    <news:news>
      <news:publication><news:name>Slotsguiden</news:name><news:language>da</news:language></news:publication>
      <news:publication_date>${esc(p.publishedAt)}</news:publication_date>
      <news:title>${esc(replaceDateVars(p.title))}</news:title>
    </news:news>
  </url>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } })
}
