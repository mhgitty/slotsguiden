import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/studio/', '/api/'] }],
    sitemap: ['https://slotsguiden.dk/sitemap.xml', 'https://slotsguiden.dk/news-sitemap.xml'],
  }
}
