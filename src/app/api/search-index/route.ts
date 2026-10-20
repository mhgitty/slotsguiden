import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'

// Site search index: a compact list of everything worth finding, built from
// Sanity and cached for an hour. The search dialog downloads it once on first
// open and filters in the browser.
export const revalidate = 3600

export interface SearchEntry {
  k: 'casino' | 'page' | 'guide' | 'post' | 'payment' | 'provider' | 'slot' | 'bonus'
  t: string          // title
  s?: string         // subline
  h: string          // href
  l?: string         // logo url
  sc?: number        // score (casinos)
}

const LOGO = '+ "?fm=webp&fit=max&w=80&q=80"'

export async function GET() {
  const q = `{
    "casinos": *[_type == "bookmaker" && defined(slug.current) && (market == "global" || !defined(market)) && defined(score)] | order(score desc) {
      name, "slug": slug.current, score, indbetalingsbonus, "logo": coalesce(logoSquare.asset->url, logo.asset->url) ${LOGO}
    },
    "pages": *[_type == "page" && defined(slug.current) && !(_id in path("drafts.**")) && (market == "global" || !defined(market))] {
      title, "slug": slug.current, "a1": parent->slug.current, "a2": parent->parent->slug.current, "a3": parent->parent->parent->slug.current, "a4": parent->parent->parent->parent->slug.current
    },
    "posts": *[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc) [0...300] { title, "slug": slug.current, "cat": category->name },
    "guides": *[_type == "casinoGuide" && defined(slug.current)] { title, "slug": slug.current },
    "payments": *[_type == "paymentMethod" && defined(slug.current)] { name, "slug": slug.current, "n": count(*[_type == "bookmaker" && references(^._id) && defined(score)]) },
    "providers": *[_type == "software" && defined(slug.current)] { name, "slug": slug.current },
    "slots": *[_type == "spillemaskine" && defined(slug.current) && (market == "global" || !defined(market))] [0...400] { "title": coalesce(name, title), "slug": slug.current }
  }`
  const d: any = await client.fetch(q).catch(() => null)
  if (!d) return NextResponse.json([], { status: 200 })

  const out: SearchEntry[] = []
  for (const c of d.casinos ?? []) out.push({ k: 'casino', t: c.name, s: c.indbetalingsbonus ? replaceDateVars(c.indbetalingsbonus) : undefined, h: `/online-casino/${c.slug}/`, l: c.logo ?? undefined, sc: c.score })
  for (const p of d.pages ?? []) {
    if (!p.title) continue
    const parts = [p.a4, p.a3, p.a2, p.a1, p.slug].filter(Boolean)
    out.push({ k: 'page', t: replaceDateVars(p.title), h: `/${parts.join('/')}/` })
  }
  for (const m of d.payments ?? []) if (m.name) out.push({ k: 'payment', t: `${m.name} casinoer`, s: m.n ? `Betalingsmetode · ${m.n} casinoer` : 'Betalingsmetode', h: `/betalingsmetoder/${m.slug}/` })
  for (const s of d.providers ?? []) if (s.name) out.push({ k: 'provider', t: `${s.name} casinoer`, s: 'Spiludvikler', h: `/spiludviklere/${s.slug}/` })
  for (const g of d.guides ?? []) if (g.title) out.push({ k: 'guide', t: replaceDateVars(g.title), s: 'Guide', h: `/guides/${g.slug}/` })
  for (const p of d.posts ?? []) if (p.title) out.push({ k: 'post', t: replaceDateVars(p.title), s: p.cat ? `Artikel · ${p.cat}` : 'Artikel', h: `/${p.slug}/` })
  for (const s of d.slots ?? []) if (s.title) out.push({ k: 'slot', t: s.title, s: 'Spillemaskine', h: `/online-spillemaskiner/${s.slug}/` })

  return NextResponse.json(out, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
