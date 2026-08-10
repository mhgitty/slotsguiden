/**
 * Slotsguiden — WordPress → Sanity migration for the 4 custom post types:
 *   casinoer         → bookmaker
 *   casino-bonusser  → bonus
 *   betalingsmetoder → paymentMethod
 *   spiludviklere    → software
 *
 * Usage (run from the project root, needs .env.local with SANITY_WRITE_TOKEN):
 *   node migrate-slotsguiden.mjs                 # migrate ALL four types
 *   node migrate-slotsguiden.mjs bonuses         # one type only
 *   node migrate-slotsguiden.mjs --dry-run       # fetch + map + report, write NOTHING
 *   node migrate-slotsguiden.mjs --limit=3       # only first 3 of each type (safe test)
 *   node migrate-slotsguiden.mjs bookmakers --limit=3
 *   node migrate-slotsguiden.mjs posts --new-only # import ONLY records not already in Sanity
 *
 * Dependencies:  npm install @sanity/client node-html-parser
 * Idempotent: each record gets a fixed _id (wp-<type>-<wpId>), so re-running
 * simply overwrites — safe to run as many times as needed. Use --new-only to
 * import just the new records and leave existing (manually edited) docs untouched.
 */
import {
  loadEnv, makeSanity, createEngine, fetchAllCPT,
  str, num, text, cleanText, slugToName, refArray, singleRef, estimateReadingTime, uid,
} from './migrate-lib.mjs'
import { parse } from 'node-html-parser'

const WP_BASE = 'https://slotsguiden.dk'

// ─── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
// Import ONLY records that don't already exist in Sanity — never touches
// existing documents, so manual edits (comparison order, popup flags, …) survive.
const newOnly = argv.includes('--new-only') || argv.includes('--skip-existing')
const limitArg = argv.find(a => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) || 0 : 0
const typeArg = argv.find(a => !a.startsWith('--'))

// title/description pair helper for the bonus "Bonustyper" fields
function pair(base, t, b) {
  const o = {}
  if (str(t)) o[`${base}Titel`] = str(t)
  if (str(b)) o[`${base}Beskrivelse`] = str(b)
  return o
}
const featuredId = (wp) => wp.featured_media || wp?._embedded?.['wp:featuredmedia']?.[0]?.id || null

// Split converted blocks at the first H2: everything before → intro, rest → body.
function splitIntroBody(blocks) {
  const i = blocks.findIndex(b => b._type === 'block' && b.style === 'h2')
  if (i <= 0) return { intro: [], body: blocks }   // no H2, or H2 is already first
  return { intro: blocks.slice(0, i), body: blocks.slice(i) }
}

// ─── document builders ─────────────────────────────────────────────────────────
async function buildBookmaker(wp, eng) {
  const acf = wp.acf || {}
  const slug = wp.slug
  const name = str(acf.casino_navn) || slugToName(slug)
  const titel = cleanText(wp.title?.rendered || '')
  const body = await eng.htmlToPortableText(wp.content?.rendered || '')
  const logo = await eng.imageField(acf.logo)
  const logoSquare = await eng.imageField(acf.logo_square)
  const ogImage = await eng.imageField(featuredId(wp))   // OG image from WP featured image
  let score = num(acf.score)
  if (score != null && score > 10) score = Math.round(score) / 10   // WP 0–100 → 0–10
  const paymentMethods = refArray('wp-paymentMethod', acf.betaligsmetoder ?? acf.betalingsmetoder)
  const software = refArray('wp-software', acf.spiludviklere)
  const aktuelleBonusser = refArray('wp-bonus', acf.aktuelle_bonusser)
  const yoast = wp.yoast_head_json || {}
  return {
    _id: `wp-bookmaker-${wp.id}`, _type: 'bookmaker',
    name, slug: { _type: 'slug', current: slug }, market: 'global',
    ...(titel ? { titel } : {}),
    url: str(acf.url) || `${WP_BASE}/go/${slug}/`,
    ...(logo ? { logo } : {}),
    ...(logoSquare ? { logoSquare } : {}),
    ...(ogImage ? { ogImage } : {}),
    ...(score != null ? { score } : {}),
    ...(str(acf.usp) ? { usp: str(acf.usp) } : {}),
    ...(str(acf.trustpilot) ? { trustpilot: str(acf.trustpilot) } : {}),
    ...(str(acf.indbetalingsbonus) ? { indbetalingsbonus: str(acf.indbetalingsbonus) } : {}),
    ...(str(acf.free_spins_bonus) ? { freeSpinsBonus: str(acf.free_spins_bonus) } : {}),
    ...(num(acf.min_indbetaling) != null ? { minIndbetaling: num(acf.min_indbetaling) } : {}),
    ...(str(acf.gennemspilskrav) ? { gennemspilskrav: str(acf.gennemspilskrav) } : {}),
    ...(str(acf.anmeldelse_link) ? { anmeldelseLink: str(acf.anmeldelse_link) } : {}),
    ...(str(acf.lanceret) ? { lanceringsdato: str(acf.lanceret) } : {}),
    ...(text(acf.terms) ? { terms: text(acf.terms) } : {}),
    ...(paymentMethods ? { paymentMethods } : {}),
    ...(software ? { software } : {}),
    ...(aktuelleBonusser ? { aktuelleBonusser } : {}),
    ...(body.length ? { body } : {}),
    ...(yoast.title ? { metaTitle: yoast.title } : {}),
    ...(yoast.description ? { metaDescription: yoast.description } : {}),
  }
}

async function buildBonus(wp, eng) {
  const acf = wp.acf || {}
  const slug = wp.slug
  const title = cleanText(wp.title?.rendered || '') || slugToName(slug)
  const body = await eng.htmlToPortableText(wp.content?.rendered || '')
  const casinoLogo = await eng.imageField(acf.casino_logo)
  const casinoLogoSquare = await eng.imageField(acf.casino_logo_square)
  const kampagneBillede = await eng.imageField(acf.kampagne_billede)
  const ogImage = await eng.imageField(featuredId(wp))   // OG image from WP featured image
  const bookmaker = singleRef('wp-bookmaker', acf.casino)
  const hvorVises = (Array.isArray(acf.hvor_skal_denne_bonus_vises)
    ? acf.hvor_skal_denne_bonus_vises.map(v => typeof v === 'string' ? v : (v?.value || v?.label || v?.name || String(v)))
    : (str(acf.hvor_skal_denne_bonus_vises) ? [str(acf.hvor_skal_denne_bonus_vises)] : [])
  ).map(v => String(v).trim()).filter(Boolean)
  const yoast = wp.yoast_head_json || {}
  return {
    _id: `wp-bonus-${wp.id}`, _type: 'bonus',
    title, slug: { _type: 'slug', current: slug }, market: 'global',
    active: !!str(acf.offer_url),
    ...(wp.date_gmt ? { publishedAt: new Date(wp.date_gmt + 'Z').toISOString() } : {}),
    ...(bookmaker ? { bookmaker } : {}),
    ...(str(acf.casino_navn) ? { casinoNavn: str(acf.casino_navn) } : {}),
    ...(casinoLogo ? { casinoLogo } : {}),
    ...(casinoLogoSquare ? { casinoLogoSquare } : {}),
    ...(str(acf.offer_url) ? { offerUrl: str(acf.offer_url) } : {}),
    ...(num(acf.minimum_indbetaling) != null ? { minimumIndbetaling: num(acf.minimum_indbetaling) } : {}),
    ...(str(acf.gennemspilskrav) ? { gennemspilskrav: str(acf.gennemspilskrav) } : {}),
    ...(str(acf['spin-vaerdi']) ? { spinVaerdi: str(acf['spin-vaerdi']) } : {}),
    ...(str(acf.maks_gevinst) ? { maksGevinst: str(acf.maks_gevinst) } : {}),
    ...(text(acf.terms_and_conditions) ? { terms: text(acf.terms_and_conditions) } : {}),
    ...(str(acf.bonuskode) ? { bonuskode: str(acf.bonuskode) } : {}),
    ...(str(acf.bonukode_promo_tekst) ? { bonuskodePromoTekst: str(acf.bonukode_promo_tekst) } : {}),
    ...(hvorVises.length ? { hvorSkalBonusVises: hvorVises } : {}),
    // ── Bonustyper (titel / beskrivelse / placering) ──
    ...pair('freeSpinsEksisterende', acf['free_spins_til_eksisterende_kunder_-_titel'], acf['free_spins_til_eksisterende_kunder_-_beskrivelse']),
    ...pair('casinoBonus', acf['casino_bonus_-_titel'], acf['casino_bonus_-_beskrivelse']),
    ...pair('indbetalingsbonus', acf['indbetalingsbonus_titel'], acf['indbetalingsbonus_-_beskrivelse']),
    ...pair('freeSpinsUdenIndbetaling', acf['free_spins_uden_indbetaling_-_titel'], acf['free_spins_uden_indbetaling_-_beskrivelse']),
    ...(str(acf['free_spins_ved_oprettelse_-_titel']) ? { freeSpinsVedOprettelseTitel: str(acf['free_spins_ved_oprettelse_-_titel']) } : {}),
    ...(str(acf['free_spins_ved_oprettelse_-_placering']) ? { freeSpinsVedOprettelsePlacering: str(acf['free_spins_ved_oprettelse_-_placering']) } : {}),
    ...pair('casinoKampagner', acf['casino_kampagner_-_titel'], acf['casino_kampagner_-_beskrivelse']),
    ...pair('bonusUdenIndbetaling', acf['bonus_uden_indbetaling_-_titel'], acf['bonus_uden_indbetaling_-_beskrivelse']),
    ...(str(acf['bonus_uden_indbetaling_-_placering']) ? { bonusUdenIndbetalingPlacering: str(acf['bonus_uden_indbetaling_-_placering']) } : {}),
    ...pair('bonusUdenOmsaetningskrav', acf['bonus_uden_omsaetningskrav_-_titel'], acf['bonus_uden_omsaetningskrav_-_beskrivelse']),
    ...pair('velkomstbonus', acf['velkomstbonus_-_titel'], acf['velkomstbonus_-_beskrivelse']),
    ...(str(acf['free_spins_-_titel']) ? { freeSpinsTitel: str(acf['free_spins_-_titel']) } : {}),
    ...pair('cashback', acf['cashback_-_titel'], acf['cashback_-_beskrivelse']),
    ...(kampagneBillede ? { kampagneBillede } : {}),
    ...(ogImage ? { ogImage } : {}),
    ...(acf.kampagne_start ? { kampagneStart: acf.kampagne_start } : {}),
    ...(acf.kampagne_slut ? { kampagneSlut: acf.kampagne_slut } : {}),
    ...(body.length ? { body } : {}),
    ...(yoast.title ? { metaTitle: yoast.title } : {}),
    ...(yoast.description ? { metaDescription: yoast.description } : {}),
  }
}

async function buildPayment(wp, eng) {
  const acf = wp.acf || {}
  const slug = wp.slug
  const titel = cleanText(wp.title?.rendered || '')   // WP post title → H1
  const name = slugToName(slug)                        // clean short name from slug
  const logo = (await eng.imageField(acf.logo)) || (await eng.imageField(featuredId(wp)))
  const ogImage = await eng.imageField(featuredId(wp))   // OG image from WP featured image
  const body = await eng.htmlToPortableText(wp.content?.rendered || '')
  const casinos = refArray('wp-bookmaker', acf.casinoer)
  const yoast = wp.yoast_head_json || {}
  return {
    _id: `wp-paymentMethod-${wp.id}`, _type: 'paymentMethod',
    name, slug: { _type: 'slug', current: slug }, market: 'global',
    ...(titel ? { titel } : {}),
    ...(logo ? { logo } : {}),
    ...(ogImage ? { ogImage } : {}),
    ...(casinos ? { casinos } : {}),
    ...(body.length ? { body } : {}),
    ...(yoast.title ? { metaTitle: yoast.title } : {}),
    ...(yoast.description ? { metaDescription: yoast.description } : {}),
  }
}

async function buildSoftware(wp, eng) {
  const acf = wp.acf || {}
  const slug = wp.slug
  const titel = cleanText(wp.title?.rendered || '')          // WP post title → H1
  const name = str(acf.navn) || slugToName(slug)             // Spiludvikler navn → Name
  const logo = (await eng.imageField(acf.logo)) || (await eng.imageField(featuredId(wp)))
  const ogImage = await eng.imageField(featuredId(wp))       // OG image from WP featured image
  const body = await eng.htmlToPortableText(wp.content?.rendered || '')
  const casinos = refArray('wp-bookmaker', acf.casinoer)
  const yoast = wp.yoast_head_json || {}
  return {
    _id: `wp-software-${wp.id}`, _type: 'software',
    name, slug: { _type: 'slug', current: slug }, market: 'global',
    ...(titel ? { titel } : {}),
    ...(logo ? { logo } : {}),
    ...(ogImage ? { ogImage } : {}),
    ...(casinos ? { casinos } : {}),
    ...(body.length ? { body } : {}),
    ...(yoast.title ? { metaTitle: yoast.title } : {}),
    ...(yoast.description ? { metaDescription: yoast.description } : {}),
  }
}

// ─── posts (blog) + categories + authors ────────────────────────────────────
async function preparePosts(posts, { sanity, eng, dryRun }) {
  // Categories — from the /categories endpoint (not _embedded)
  const cats = await fetchAllCPT(WP_BASE, 'categories', 0, false)
  const categoryMap = {}
  for (const c of cats) {
    const id = `wp-category-${c.id}`
    categoryMap[c.id] = id
    if (!dryRun) await sanity.createOrReplace({
      _id: id, _type: 'category',
      name: cleanText(c.name) || c.slug, slug: { _type: 'slug', current: c.slug },
      ...(cleanText(c.description) ? { description: cleanText(c.description) } : {}),
    })
  }
  // Authors — from the /users endpoint (may be restricted; falls back to none)
  const authorMap = {}
  let users = []
  try { users = await fetchAllCPT(WP_BASE, 'users', 0, false) } catch { users = [] }
  for (const u of users) {
    const id = `wp-author-${u.id}`
    authorMap[u.id] = id
    if (!dryRun) {
      const av = u.avatar_urls || {}
      const avatar = av['96'] || av['48'] || Object.values(av).pop() || null
      const image = avatar ? await eng.imageField(avatar) : null
      await sanity.createOrReplace({
        _id: id, _type: 'author',
        name: cleanText(u.name) || u.slug || String(u.id),
        slug: { _type: 'slug', current: u.slug || String(u.id) },
        ...(image ? { image } : {}),
        ...(cleanText(u.description) ? { bio: cleanText(u.description) } : {}),
      })
    }
  }
  console.log(`  → prepared ${cats.length} categories, ${users.length} authors`)
  return { categoryMap, authorMap }
}

async function buildPost(wp, eng, ctx = {}) {
  const slug = wp.slug
  const title = cleanText(wp.title?.rendered || '') || slugToName(slug)
  const body = await eng.htmlToPortableText(wp.content?.rendered || '')
  const featuredImage = await eng.imageField(featuredId(wp))
  const catId = (Array.isArray(wp.categories) && wp.categories.length) ? ctx.categoryMap?.[wp.categories[0]] : null
  const authorId = ctx.authorMap?.[wp.author]
  const yoast = wp.yoast_head_json || {}
  return {
    _id: `wp-post-${wp.id}`, _type: 'post',
    title, slug: { _type: 'slug', current: slug },
    ...(wp.excerpt?.rendered ? { excerpt: cleanText(wp.excerpt.rendered).slice(0, 300) } : {}),
    ...(featuredImage ? { featuredImage, ogImage: featuredImage } : {}),
    ...(catId ? { category: { _type: 'reference', _ref: catId, _weak: true } } : {}),
    ...(authorId ? { author: { _type: 'reference', _ref: authorId, _weak: true } } : {}),
    ...(body.length ? { body } : {}),
    readingTime: estimateReadingTime(wp.content?.rendered || ''),
    ...(wp.date_gmt ? { publishedAt: new Date(wp.date_gmt + 'Z').toISOString() } : {}),
    ...(wp.modified_gmt ? { lastUpdated: new Date(wp.modified_gmt + 'Z').toISOString() } : {}),
    ...(yoast.title ? { metaTitle: yoast.title } : {}),
    ...(yoast.description ? { metaDescription: yoast.description } : {}),
  }
}

async function buildPage(wp, eng) {
  const slug = wp.slug
  const title = cleanText(wp.title?.rendered || '') || slugToName(slug)
  const allBlocks = await eng.htmlToPortableText(wp.content?.rendered || '')
  const { intro, body } = splitIntroBody(allBlocks)   // lead text → intro, rest → body
  const featuredImage = await eng.imageField(featuredId(wp))
  const yoast = wp.yoast_head_json || {}
  return {
    _id: `wp-page-${wp.id}`, _type: 'page',
    title, slug: { _type: 'slug', current: slug }, market: 'global',
    // Preserve WordPress hierarchy → correct nested paths (/parent/this-page/)
    ...(wp.parent ? { parent: { _type: 'reference', _ref: `wp-page-${wp.parent}`, _weak: true } } : {}),
    ...(featuredImage ? { featuredImage } : {}),
    ...(intro.length ? { intro } : {}),
    ...(body.length ? { body } : {}),
    ...(wp.modified_gmt ? { lastUpdated: new Date(wp.modified_gmt + 'Z').toISOString() } : {}),
    ...(yoast.title ? { metaTitle: yoast.title } : {}),
    ...(yoast.description ? { metaDescription: yoast.description } : {}),
  }
}

// ─── Spillemaskiner (game / unit) ───────────────────────────────────────────
// These pages embed a self-contained game-demo widget (a <div id="...-wrapper">
// with inline <style>/<script> + a Pragmatic Play demo <iframe>). The normal
// HTML→Portable Text conversion drops scripts/iframes, so we lift that widget
// OUT as raw HTML (an htmlBlock) and convert the rest of the article normally.
function extractDemoHtml(html) {
  let root
  try { root = parse(html, { comment: false }) } catch { return { demoHtml: null, restHtml: html } }

  const all = root.querySelectorAll('*')
  let demoNode = null

  // 1) Preferred: a container whose id ends in "-wrapper" (the demo widget root).
  for (const el of all) {
    const id = el.getAttribute && el.getAttribute('id')
    if (id && /-wrapper$/i.test(id)) { demoNode = el; break }
  }
  // 2) Fallback: first block-level element that directly holds an <iframe> or a
  //    non-JSON-LD <script> (the click-to-load demo player).
  if (!demoNode) {
    for (const el of all) {
      if (!/^(DIV|SECTION)$/i.test(el.tagName || '')) continue
      const iframe = el.querySelector('iframe')
      const script = el.querySelector('script')
      const isJsonLd = script && (script.getAttribute('type') || '') === 'application/ld+json'
      if (iframe || (script && !isJsonLd)) { demoNode = el; break }
    }
  }

  if (!demoNode) return { demoHtml: null, restHtml: html }

  const demoHtml = demoNode.outerHTML
  demoNode.remove()
  // Drop any stray <script> left behind (e.g. standalone JSON-LD) — the route
  // generates its own structured data.
  root.querySelectorAll('script').forEach((s) => s.remove())
  return { demoHtml, restHtml: root.toString() }
}

async function buildSpillemaskine(wp, eng) {
  const slug = wp.slug
  const name = cleanText(wp.title?.rendered || '') || slugToName(slug)
  const content = wp.content?.rendered || ''
  const { demoHtml, restHtml } = extractDemoHtml(content)

  const articleBlocks = await eng.htmlToPortableText(restHtml)
  const body = []
  if (demoHtml) body.push({ _type: 'htmlBlock', _key: uid(), html: demoHtml })
  body.push(...articleBlocks)

  const featuredImage = await eng.imageField(featuredId(wp))
  const yoast = wp.yoast_head_json || {}
  return {
    _id: `wp-spillemaskine-${wp.id}`, _type: 'spillemaskine',
    name, titel: name,
    slug: { _type: 'slug', current: slug }, market: 'global',
    ...(featuredImage ? { featuredImage, ogImage: featuredImage } : {}),
    ...(body.length ? { body } : {}),
    ...(wp.date_gmt ? { publishedAt: new Date(wp.date_gmt + 'Z').toISOString() } : {}),
    ...(wp.modified_gmt ? { lastUpdated: new Date(wp.modified_gmt + 'Z').toISOString() } : {}),
    ...(yoast.title ? { metaTitle: yoast.title } : {}),
    ...(yoast.description ? { metaDescription: yoast.description } : {}),
  }
}

const TYPES = {
  bookmakers: { restBase: 'casinoer', sanityType: 'bookmaker', label: '🎰 Casinoer → bookmaker', build: buildBookmaker },
  spillemaskiner: { restBase: 'unit', sanityType: 'spillemaskine', label: '🎰 Spillemaskiner → spillemaskine', build: buildSpillemaskine },
  bonuses: { restBase: 'casino-bonusser', sanityType: 'bonus', label: '🎁 Casino bonusser → bonus', build: buildBonus },
  payment: { restBase: 'betalingsmetoder', sanityType: 'paymentMethod', label: '💳 Betalingsmetoder → paymentMethod', build: buildPayment },
  software: { restBase: 'spiludviklere', sanityType: 'software', label: '🎮 Spiludviklere → software', build: buildSoftware },
  posts: { restBase: 'posts', sanityType: 'post', label: '📝 Posts → post (+ categories, authors)', build: buildPost, prepare: preparePosts },
  pages: { restBase: 'pages', sanityType: 'page', label: '📄 Pages → page', build: buildPage },
}
// Custom types run by default; posts/pages run explicitly (or with "all").
const ORDER = ['bookmakers', 'payment', 'software', 'bonuses']

// ─── runner ─────────────────────────────────────────────────────────────────
async function migrateType(key, sanity, eng) {
  const cfg = TYPES[key]
  console.log(`\n${'═'.repeat(60)}\n${cfg.label}   (${WP_BASE}/wp-json/wp/v2/${cfg.restBase})`)
  const posts = await fetchAllCPT(WP_BASE, cfg.restBase, LIMIT)
  console.log(`  Found ${posts.length} records${LIMIT ? ` (limited to ${LIMIT})` : ''}`)

  // In --new-only mode, pre-fetch the IDs already in Sanity so we can skip them
  // (and avoid re-uploading their images) without overwriting existing docs.
  let existingIds = new Set()
  if (newOnly) {
    existingIds = new Set(await sanity.fetch('*[_type == $t]._id', { t: cfg.sanityType }))
    console.log(`  ${existingIds.size} already in Sanity — importing NEW records only`)
  }
  console.log('')

  const ctx = cfg.prepare ? await cfg.prepare(posts, { sanity, eng, dryRun }) : {}
  const acfKeysSeen = new Set()
  let ok = 0, fail = 0, noImg = 0, linked = 0, demo = 0, skipped = 0
  for (const wp of posts) {
    Object.keys(wp.acf || {}).forEach(k => acfKeysSeen.add(k))
    // Deterministic ID (wp-<type>-<wpId>) lets us skip existing docs before the
    // expensive build/image-upload step.
    if (newOnly && existingIds.has(`wp-${cfg.sanityType}-${wp.id}`)) { skipped++; continue }
    try {
      const doc = await cfg.build(wp, eng, ctx)
      if (!dryRun) await sanity.createOrReplace(doc)
      ok++
      const hasImg = !!(doc.logo || doc.casinoLogo || doc.featuredImage || doc.ogImage)
      if (!hasImg) noImg++
      const hasDemo = Array.isArray(doc.body) && doc.body.some(b => b && b._type === 'htmlBlock')
      if (hasDemo) demo++
      const refs = (doc.paymentMethods?.length || 0) + (doc.software?.length || 0) + (doc.aktuelleBonusser?.length || 0) + (doc.casinos?.length || 0) + (doc.bookmaker ? 1 : 0) + (doc.category ? 1 : 0) + (doc.author ? 1 : 0)
      if (refs) linked++
      const flags = [hasImg ? 'img' : 'no-img', hasDemo ? 'demo ✓' : 'no-demo', refs ? `${refs} refs` : ''].filter(Boolean).join(' · ')
      console.log(`  ${dryRun ? '·' : '✅'} ${doc._id}  ${doc.name || doc.title}  [${flags}]`)
    } catch (err) {
      fail++
      console.error(`  ❌ ${wp.slug}: ${err.message}`)
    }
  }
  console.log(`\n  → ${ok} ${dryRun ? 'mapped' : 'written'}${newOnly ? ` (new)` : ''}, ${skipped} skipped (already existed), ${fail} failed, ${noImg} without image, ${demo} with demo widget, ${linked} with relationships`)
  if (acfKeysSeen.size) console.log(`  → ACF keys present on these records:\n     ${[...acfKeysSeen].sort().join(', ')}`)
  return { ok, fail, skipped }
}

async function main() {
  const env = loadEnv()
  const sanity = makeSanity(env)
  const eng = createEngine({ sanity, wpBase: WP_BASE, dryRun })
  console.log(`\nSlotsguiden migration → project ${env['NEXT_PUBLIC_SANITY_PROJECT_ID']} / ${env['NEXT_PUBLIC_SANITY_DATASET'] || 'production'}`)
  console.log(dryRun ? '🧪 DRY RUN — nothing will be written to Sanity' : '✍️  LIVE — writing to Sanity')
  if (newOnly) console.log('🆕 NEW-ONLY — existing documents are skipped, never overwritten')
  const keys = !typeArg ? ORDER : (typeArg === 'all' ? [...ORDER, 'posts', 'pages'] : [typeArg])
  for (const k of keys) {
    if (!TYPES[k]) { console.error(`Unknown type "${k}". Valid: ${Object.keys(TYPES).join(', ')}, all`); process.exit(1) }
  }
  let totalOk = 0, totalFail = 0, totalSkipped = 0
  for (const k of keys) { const r = await migrateType(k, sanity, eng); totalOk += r.ok; totalFail += r.fail; totalSkipped += (r.skipped || 0) }
  console.log(`\n${'═'.repeat(60)}\n✨ Done. ${totalOk} records ${dryRun ? 'mapped' : 'imported'}, ${totalSkipped} skipped, ${totalFail} failed.`)
  if (dryRun) console.log('Re-run without --dry-run to write to Sanity.')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
