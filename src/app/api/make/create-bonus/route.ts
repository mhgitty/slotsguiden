import { NextRequest, NextResponse } from 'next/server'
import { htmlToPortableText, canonicalizeUrl } from '../htmlToPortableText'

// Make.com → Sanity bridge: creates a DRAFT "free spins til eksisterende kunder"
// bonus. Fields arrive form-encoded (or JSON); the mutation is assembled here with
// JSON.stringify so quotes/newlines in AI text can never break the request. The
// Sanity write token stays server-side (never in Make).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN
const SECRET = process.env.MAKE_WEBHOOK_SECRET
const API_VER = '2026-01-01'

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\sæøå-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)
}

// Sanity document _id may only contain [a-zA-Z0-9._-] — no æ/ø/å or other
// non-ASCII. Transliterate Danish letters and strip the rest so the id is
// always valid, independent of the URL slug (which may keep æøå).
function asciiId(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .normalize('NFKD') // decompose remaining accents (é -> e + mark)
    .replace(/[^a-z0-9]+/g, '-') // any non-ASCII / punctuation (incl. marks) -> dash
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function POST(req: NextRequest) {
  // ── Auth: shared secret so only your Make scenario can post here ──
  if (!SECRET || req.headers.get('x-make-secret') !== SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!PROJECT || !TOKEN) {
    return NextResponse.json({ error: 'server not configured (SANITY_WRITE_TOKEN / project id missing)' }, { status: 500 })
  }

  // ── Read fields — bulletproof against whatever Make sends ──
  // We read the raw body ONCE, then try JSON and urlencoded parsing regardless
  // of the declared content-type (Make often mislabels it). This way the route
  // works whether Make posts JSON, form-urlencoded, or a raw string.
  const ct = (req.headers.get('content-type') || '').toLowerCase()
  const raw = await req.text().catch(() => '')
  const f: Record<string, string> = {}

  const fromJson = (s: string): boolean => {
    try {
      const j = JSON.parse(s)
      if (j && typeof j === 'object' && !Array.isArray(j)) {
        for (const k of Object.keys(j)) f[k] = clean(j[k])
        return Object.keys(f).length > 0
      }
    } catch { /* not JSON */ }
    return false
  }
  const fromUrlEncoded = (s: string): boolean => {
    try {
      const p = new URLSearchParams(s)
      let any = false
      p.forEach((v, k) => { f[k] = (v ?? '').trim(); any = true })
      return any
    } catch { /* not urlencoded */ }
    return false
  }

  const trimmed = (raw || '').trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    fromJson(trimmed) || fromUrlEncoded(raw)
  } else {
    fromUrlEncoded(raw) || fromJson(trimmed)
  }

  const casino = clean(f.casino)
  const bonus = clean(f.bonus)
  if (!casino || !bonus) {
    // Diagnostic: echo back what actually arrived so a misconfigured Make
    // request is obvious — an empty rawLength means Make sent no body at all.
    return NextResponse.json({
      error: 'casino and bonus are required',
      contentType: ct || null,
      rawLength: raw.length,
      rawPreview: raw.slice(0, 120),
      receivedKeys: Object.keys(f),
      receivedValues: Object.fromEntries(Object.keys(f).map((k) => [k, (f[k] || '').slice(0, 40)])),
      casinoPresent: !!casino,
      bonusPresent: !!bonus,
    }, { status: 400 })
  }

  const slug = slugify(f.slug || `${casino}-${bonus}`)
  const bodyHtml = clean(f.bodyHtml)

  // Parse the AI HTML into proper Portable Text blocks (headings, lists, FAQ,
  // etc.). If anything goes wrong, fall back to a single raw htmlBlock so we
  // never lose the content.
  let body: unknown[] | undefined
  if (bodyHtml) {
    try {
      const blocks = htmlToPortableText(bodyHtml)
      body = blocks.length ? blocks : [{ _type: 'htmlBlock', _key: 'aicontent', html: canonicalizeUrl(bodyHtml) }]
    } catch {
      body = [{ _type: 'htmlBlock', _key: 'aicontent', html: canonicalizeUrl(bodyHtml) }]
    }
  }

  // Stat fields from the sheet. minimumIndbetaling is a number in the schema.
  const minDeposit = (() => {
    const n = parseFloat((clean(f.minimumIndbetaling) || '').replace(',', '.').replace(/[^\d.]/g, ''))
    return Number.isFinite(n) ? n : undefined
  })()

  // Draft so it lands in Studio for review (like the old WordPress "draft").
  const doc: Record<string, unknown> = {
    _id: `drafts.autobonus-${asciiId(slug) || 'bonus'}-${Date.now().toString(36)}`,
    _type: 'bonus',
    market: 'global',
    active: false,
    showInFreeSpinsGrid: true,
    title: `${casino} – ${bonus}`,
    slug: { _type: 'slug', current: slug },
    casinoNavn: casino,
    oddsBonusTitel: bonus,
    freeSpinsEksisterendeTitel: bonus,
    ...(clean(f.metaTitle) ? { metaTitle: clean(f.metaTitle) } : {}),
    ...(clean(f.metaDescription) ? { metaDescription: clean(f.metaDescription) } : {}),
    ...(clean(f.bonusText) ? { freeSpinsEksisterendeBeskrivelse: clean(f.bonusText) } : {}),
    ...(clean(f.offerUrl) ? { offerUrl: canonicalizeUrl(clean(f.offerUrl)) } : {}),
    ...(minDeposit !== undefined ? { minimumIndbetaling: minDeposit } : {}),
    ...(clean(f.spinVaerdi) ? { spinVaerdi: clean(f.spinVaerdi) } : {}),
    ...(clean(f.maksGevinst) ? { maksGevinst: clean(f.maksGevinst) } : {}),
    ...(clean(f.gennemspilskrav) ? { gennemspilskrav: clean(f.gennemspilskrav) } : {}),
    ...(clean(f.minimumOdds) ? { minimumOdds: clean(f.minimumOdds) } : {}),
    ...(body ? { body } : {}),
  }

  // Sanity write, wrapped so a network blip returns a clean JSON error rather
  // than an unhandled exception (which Make would see as a bare 502/ConnectionError).
  let res: Response
  try {
    res = await fetch(`https://${PROJECT}.api.sanity.io/v${API_VER}/data/mutate/${DATASET}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ mutations: [{ create: doc }] }),
    })
  } catch (err) {
    // 422 (not 5xx) so Make surfaces this as a readable DataError with the body,
    // instead of a bare "ConnectionError" that hides the reason.
    return NextResponse.json({ error: 'could not reach Sanity', detail: String(err) }, { status: 422 })
  }

  const out = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json({ error: 'sanity mutate failed', status: res.status, detail: out }, { status: 422 })
  }
  return NextResponse.json({ ok: true, id: doc._id, slug, results: (out as any).results ?? out })
}
