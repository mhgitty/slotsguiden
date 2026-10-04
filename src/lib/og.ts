// Social-share (Open Graph / Twitter) image helper.
const BASE = 'https://slotsguiden.dk'
export const DEFAULT_OG_IMAGE = `${BASE}/og.png`

/**
 * Returns a link-unfurl-safe image URL.
 * - Falls back to the site default when no image is given.
 * - Serves Sanity CDN images as JPEG rather than WebP: many unfurlers
 *   (Slack, iMessage, Facebook, LinkedIn…) don't render WebP OG images.
 */
export function ogImageUrl(url?: string | null): string {
  if (!url) return DEFAULT_OG_IMAGE
  if (!url.includes('cdn.sanity.io')) return url
  return /[?&]fm=/i.test(url)
    ? url.replace(/([?&])fm=[^&]*/i, '$1fm=jpg')
    : url + (url.includes('?') ? '&' : '?') + 'fm=jpg'
}
