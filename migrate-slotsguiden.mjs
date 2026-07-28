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
 *
 * Dependencies:  npm install @sanity/client node-html-parser
 * Idempotent: each record gets a fixed _id (wp-<type>-<wpId>), so re-running
 * simply overwrites — safe to run as many times as needed.
 */
import {
  loadEnv, makeSanity, createEngine, fetchAllCPT,
  str, num, text, cleanText, slugToName, refArray, singleRef,
} from './migrate-lib.mjs'

const WP_BASE = 'https://slotsguiden.dk'

// ─── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
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

const TYPES = {
  bookmakers: { restBase: 'casinoer', label: '🎰 Casinoer → bookmaker', build: buildBookmaker },
  bonuses: { restBase: 'casino-bonusser', label: '🎁 Casino bonusser → bonus', build: buildBonus },
  payment: { restBase: 'betalingsmetoder', label: '💳 Betalingsmetoder → paymentMethod', build: buildPayment },
  software: { restBase: 'spiludviklere', label: '🎮 Spiludviklere → software', build: buildSoftware },
}
const ORDER = ['bookmakers', 'payment', 'software', 'bonuses']

// ─── runner ─────────────────────────────────────────────────────────────────
async function migrateType(key, sanity, eng) {
  const cfg = TYPES[key]
  console.log(`\n${'═'.repeat(60)}\n${cfg.label}   (${WP_BASE}/wp-json/wp/v2/${cfg.restBase})`)
  const posts = await fetchAllCPT(WP_BASE, cfg.restBase, LIMIT)
  console.log(`  Found ${posts.length} records${LIMIT ? ` (limited to ${LIMIT})` : ''}\n`)
  const acfKeysSeen = new Set()
  let ok = 0, fail = 0, noLogo = 0, linked = 0
  for (const wp of posts) {
    Object.keys(wp.acf || {}).forEach(k => acfKeysSeen.add(k))
    try {
      const doc = await cfg.build(wp, eng)
      if (!dryRun) await sanity.createOrReplace(doc)
      ok++
      const hasLogo = !!(doc.logo || doc.casinoLogo)
      if (!hasLogo) noLogo++
      const refs = (doc.paymentMethods?.length || 0) + (doc.software?.length || 0) + (doc.aktuelleBonusser?.length || 0) + (doc.casinos?.length || 0) + (doc.bookmaker ? 1 : 0)
      if (refs) linked++
      const flags = [hasLogo ? 'logo' : 'no-logo', refs ? `${refs} refs` : ''].filter(Boolean).join(' · ')
      console.log(`  ${dryRun ? '·' : '✅'} ${doc._id}  ${doc.name || doc.title}  [${flags}]`)
    } catch (err) {
      fail++
      console.error(`  ❌ ${wp.slug}: ${err.message}`)
    }
  }
  console.log(`\n  → ${ok} ${dryRun ? 'mapped' : 'written'}, ${fail} failed, ${noLogo} without logo, ${linked} with relationships`)
  console.log(`  → ACF keys present on these records:\n     ${[...acfKeysSeen].sort().join(', ') || '(none)'}`)
  return { ok, fail }
}

async function main() {
  const env = loadEnv()
  const sanity = makeSanity(env)
  const eng = createEngine({ sanity, wpBase: WP_BASE, dryRun })
  console.log(`\nSlotsguiden migration → project ${env['NEXT_PUBLIC_SANITY_PROJECT_ID']} / ${env['NEXT_PUBLIC_SANITY_DATASET'] || 'production'}`)
  console.log(dryRun ? '🧪 DRY RUN — nothing will be written to Sanity' : '✍️  LIVE — writing to Sanity')
  const keys = typeArg ? [typeArg] : ORDER
  for (const k of keys) {
    if (!TYPES[k]) { console.error(`Unknown type "${k}". Valid: ${Object.keys(TYPES).join(', ')}`); process.exit(1) }
  }
  let totalOk = 0, totalFail = 0
  for (const k of keys) { const r = await migrateType(k, sanity, eng); totalOk += r.ok; totalFail += r.fail }
  console.log(`\n${'═'.repeat(60)}\n✨ Done. ${totalOk} records ${dryRun ? 'mapped' : 'imported'}, ${totalFail} failed.`)
  if (dryRun) console.log('Re-run without --dry-run to write to Sanity.')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
