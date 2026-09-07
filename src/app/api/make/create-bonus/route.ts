import { NextRequest, NextResponse } from 'next/server'

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

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function POST(req: NextRequest) {
  // ── Auth: shared secret so only your Make scenario can post here ──
  if (!SECRET || req.headers.get('x-make-secret') !== SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!PROJECT || !TOKEN) {
    return NextResponse.json({ error: 'server not configured (SANITY_WRITE_TOKEN / project id missing)' }, { status: 500 })
  }

  // ── Read fields from form-data, urlencoded, or JSON ──
  const f: Record<string, string> = {}
  const ct = (req.headers.get('content-type') || '').toLowerCase()
  try {
    if (ct.includes('application/json')) {
      const j = await req.json()
      for (const k of Object.keys(j || {})) f[k] = clean(j[k])
    } else {
      const fd = await req.formData()
      fd.forEach((v, k) => { f[k] = typeof v === 'string' ? v : '' })
    }
  } catch {
    return NextResponse.json({ error: 'could not parse request body' }, { status: 400 })
  }

  const casino = clean(f.casino)
  const bonus = clean(f.bonus)
  if (!casino || !bonus) {
    // Diagnostic: echo back what actually arrived so a misconfigured Make
    // mapping is obvious (which keys came through, and whether they were empty).
    return NextResponse.json({
      error: 'casino and bonus are required',
      contentType: ct || null,
      receivedKeys: Object.keys(f),
      receivedValues: Object.fromEntries(Object.keys(f).map((k) => [k, (f[k] || '').slice(0, 40)])),
      casinoPresent: !!casino,
      bonusPresent: !!bonus,
    }, { status: 400 })
  }

  const slug = slugify(f.slug || `${casino}-${bonus}`)
  const bodyHtml = clean(f.bodyHtml)

  // Draft so it lands in Studio for review (like the old WordPress "draft").
  const doc: Record<string, unknown> = {
    _id: `drafts.autobonus-${slug || 'bonus'}-${Date.now().toString(36)}`,
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
    ...(clean(f.offerUrl) ? { offerUrl: clean(f.offerUrl) } : {}),
    ...(bodyHtml ? { body: [{ _type: 'htmlBlock', _key: 'aicontent', html: bodyHtml }] } : {}),
  }

  const res = await fetch(`https://${PROJECT}.api.sanity.io/v${API_VER}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ mutations: [{ create: doc }] }),
  })

  const out = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json({ error: 'sanity mutate failed', status: res.status, detail: out }, { status: 502 })
  }
  return NextResponse.json({ ok: true, id: doc._id, slug, results: (out as any).results ?? out })
}
