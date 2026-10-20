// Responsive Sanity images: build src/srcSet/sizes from one Sanity CDN URL.
// The CDN resizes on the fly from the w (and h) parameter, so the browser can
// pick the smallest file that is still sharp for the slot it is shown in.

const isSanity = (u?: string | null): u is string => !!u && u.startsWith('https://cdn.sanity.io/')

/** Same image at another width. Keeps fm/fit/q; scales h for fixed crops. */
export function sized(url: string | null | undefined, w: number): string {
  if (!isSanity(url)) return url || ''
  const u = new URL(url)
  const oldW = Number(u.searchParams.get('w')) || 0
  const oldH = Number(u.searchParams.get('h')) || 0
  u.searchParams.set('w', String(w))
  if (oldH && oldW) u.searchParams.set('h', String(Math.round((oldH * w) / oldW)))
  if (!u.searchParams.get('fm')) u.searchParams.set('fm', 'webp')
  if (!u.searchParams.get('fit')) u.searchParams.set('fit', 'max')
  if (!u.searchParams.get('q')) u.searchParams.set('q', '75')
  return u.toString()
}

/**
 * Props for an <img>: src at the middle width plus a srcSet the browser chooses from.
 * sizes tells the browser how wide the image is shown, e.g. "(max-width: 760px) 100vw, 360px".
 */
export function responsive(url: string | null | undefined, sizes: string, widths: number[] = [400, 700, 1000]) {
  if (!isSanity(url)) return { src: url || '' }
  const ws = [...widths].sort((a, b) => a - b)
  return {
    src: sized(url, ws[Math.floor((ws.length - 1) / 2)]),
    srcSet: ws.map((w) => `${sized(url, w)} ${w}w`).join(', '),
    sizes,
  }
}
