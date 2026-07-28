import { NextRequest, NextResponse } from 'next/server'

// ── Sanity CDN config (edge-safe: plain fetch, no SDK) ────────────────────────
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET!
const API_VER    = '2026-04-22'

// ── In-memory cache (5 min TTL) ───────────────────────────────────────────────
type RedirectMap = Record<string, string>
let cache: RedirectMap | null = null
let cacheExpiry = 0
const TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getRedirects(): Promise<RedirectMap> {
  const now = Date.now()
  if (cache && now < cacheExpiry) return cache

  try {
    const query = encodeURIComponent(
      `*[_type == "pageRedirect" && active == true]{ "from": from, "to": to }`
    )
    const url = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VER}/data/query/${DATASET}?query=${query}`
    const res = await fetch(url, { next: { revalidate: 300 } })

    if (!res.ok) return cache ?? {}

    const data = await res.json() as { result: { from: string; to: string }[] }
    const map: RedirectMap = {}
    for (const r of data.result ?? []) {
      if (r.from && r.to) map[r.from] = r.to
    }
    cache = map
    cacheExpiry = now + TTL_MS
    return map
  } catch {
    return cache ?? {}
  }
}

// ── Middleware ─────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip studio, API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/studio') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const redirects = await getRedirects()

  // Try exact match, then try with/without trailing slash
  const destination =
    redirects[pathname] ??
    redirects[pathname.endsWith('/') ? pathname.slice(0, -1) : pathname + '/']

  if (destination) {
    const target = destination.startsWith('http')
      ? destination
      : new URL(destination, request.url).toString()
    return NextResponse.redirect(target, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
