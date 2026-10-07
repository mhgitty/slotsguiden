import type { NextRequest } from 'next/server'

// Forwards incoming query params (e.g. ?placement=/page/) onto the affiliate
// destination — the Next.js equivalent of Apache's [QSA] flag. Append-only: it
// never overrides a param the destination URL already carries. If `placement`
// wasn't passed on the link, it falls back to the Referer page path.
export function buildRedirectDestination(destination: string, req: NextRequest): string {
  let dest: URL
  try {
    dest = new URL(destination)
  } catch {
    return destination // non-absolute destination — leave untouched
  }

  req.nextUrl.searchParams.forEach((value, key) => {
    if (!dest.searchParams.has(key)) dest.searchParams.set(key, value)
  })

  if (!dest.searchParams.has('placement')) {
    const ref = req.headers.get('referer')
    if (ref) {
      try { dest.searchParams.set('placement', new URL(ref).pathname) } catch { /* ignore */ }
    }
  }

  return dest.toString()
}
