/**
 * WordPress "Casino Bonusser" CPT → Sanity bonus documents
 *
 * Run: node migrate-bonuses.mjs
 */

import { createClient } from '@sanity/client'
import { parse } from 'node-html-parser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SANITY_TOKEN      = loadEnv()['SANITY_WRITE_TOKEN'] || ''
const SANITY_PROJECT_ID = ''
const WP_BASE           = 'https://pokcas.com'
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const raw = readFileSync(resolve('.env.local'), 'utf-8')
    const vars = {}
    for (const line of raw.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k && v.length) vars[k.trim()] = v.join('=').trim()
    }
    return vars
  } catch { return {} }
}

const env        = loadEnv()
const PROJECT_ID = env['NEXT_PUBLIC_SANITY_PROJECT_ID'] || SANITY_PROJECT_ID
const DATASET    = env['NEXT_PUBLIC_SANITY_DATASET'] || 'production'

const sanity = createClient({ projectId: PROJECT_ID, dataset: DATASET, token: SANITY_TOKEN, apiVersion: '2026-01-01', useCdn: false })

// ─── UTILITIES ────────────────────────────────────────────────────────────────

let _c = 0
const uid           = () => `k${Date.now().toString(36)}${(_c++).toString(36)}`
const stripHtml     = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const decodeEntities = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
const cls           = (node) => node.getAttribute?.('class') || ''
const hasClass      = (node, ...names) => names.some(n => cls(node).includes(n))
const str           = (v) => (typeof v === 'string' && v.trim()) ? v.trim() : undefined
const num           = (v) => { const n = parseFloat(String(v)); return isNaN(n) ? undefined : n }

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────

const imageCache = new Map()
const mediaAltCache = new Map()

async function getMediaAlt(mediaId) {
  if (!mediaId) return null
  if (mediaAltCache.has(mediaId)) return mediaAltCache.get(mediaId)
  try {
    const res = await fetch(`${WP_BASE}/wp-json/wp/v2/media/${mediaId}`)
    if (!res.ok) return null
    const data = await res.json()
    const alt = data.alt_text || data.title?.rendered || null
    mediaAltCache.set(mediaId, alt)
    return alt
  } catch { return null }
}

async function uploadImage(src) {
  if (!src || src.startsWith('data:')) return null
  if (src.startsWith('//')) src = 'https:' + src
  if (imageCache.has(src)) return imageCache.get(src)
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const filename = src.split('/').pop().split('?')[0] || 'image.jpg'
    const asset = await sanity.assets.upload('image', buffer, { contentType, filename })
    imageCache.set(src, asset._id)
    process.stdout.write(`  📷 ${filename}\n`)
    return asset._id
  } catch (err) {
    process.stdout.write(`  ⚠️  Image skip: ${src.split('/').pop()} (${err.message})\n`)
    return null
  }
}

const imageRef = (assetId, alt) => assetId
  ? { _type: 'image', asset: { _type: 'reference', _ref: assetId }, ...(alt ? { alt } : {}) }
  : null

// ─── INLINE SPANS ─────────────────────────────────────────────────────────────

function inlineToSpans(node) {
  const spans = []
  function walk(n, marks = []) {
    if (n.nodeType === 3) {
      const text = n.text
      if (text) spans.push({ _type: 'span', _key: uid(), text, marks: [...marks] })
      return
    }
    const tag = n.tagName?.toLowerCase()
    if (tag === 'strong' || tag === 'b') n.childNodes.forEach(c => walk(c, [...marks, 'strong']))
    else if (tag === 'em' || tag === 'i') n.childNodes.forEach(c => walk(c, [...marks, 'em']))
    else if (tag === 'a') {
      const key = uid()
      spans._markDefs = spans._markDefs || []
      spans._markDefs.push({ _key: key, _type: 'link', href: n.getAttribute('href') || '', blank: n.getAttribute('target') === '_blank' })
      n.childNodes.forEach(c => walk(c, [...marks, key]))
    } else n.childNodes.forEach(c => walk(c, marks))
  }
  walk(node)
  return spans
}

const makeBlock = (style, spans) => ({ _type: 'block', _key: uid(), style, markDefs: spans._markDefs || [], children: spans })

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function tryParseFaqNode(node) {
  const c = cls(node)
  if (c.includes('schema-faq') || c.includes('yoast-faq')) {
    const items = []
    for (const s of node.querySelectorAll('.schema-faq-section, [class*="faq-section"]')) {
      const q = s.querySelector('.schema-faq-question, strong, h3, h4')
      const a = s.querySelector('.schema-faq-answer, p')
      if (q && a) items.push({ question: decodeEntities(stripHtml(q.innerHTML)), answer: decodeEntities(stripHtml(a.innerHTML)) })
    }
    if (items.length) return items
  }
  if (c.includes('faq') || c.includes('accordion')) {
    const items = []
    const children = node.childNodes.filter(n => n.tagName)
    let i = 0
    while (i < children.length) {
      const tag = children[i].tagName?.toLowerCase()
      if (['h2','h3','h4','dt'].includes(tag)) {
        const qText = decodeEntities(stripHtml(children[i].innerHTML))
        const next  = children[i + 1]
        if (next && ['p','div','dd'].includes(next.tagName?.toLowerCase())) {
          const aText = decodeEntities(stripHtml(next.innerHTML))
          if (qText && aText) { items.push({ question: qText, answer: aText }); i += 2; continue }
        }
      }
      i++
    }
    if (items.length) return items
  }
  return null
}

function groupFaqBlocks(blocks) {
  const out = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]
    const text = b.children?.map(c => c.text).join('').toLowerCase() || ''
    if (b._type === 'block' && b.style === 'h2' && (text.includes('faq') || text.includes('ofte stillede') || text.includes('spørgsmål'))) {
      const items = []
      let j = i + 1
      while (j < blocks.length) {
        const qBlock = blocks[j], aBlock = blocks[j + 1]
        if (qBlock?._type === 'block' && (qBlock.style === 'h3' || qBlock.style === 'h4') &&
            aBlock?._type === 'block' && aBlock.style === 'normal') {
          items.push({ question: qBlock.children?.map(c => c.text).join('') || '', answer: aBlock.children?.map(c => c.text).join('') || '' })
          j += 2
        } else break
      }
      if (items.length >= 2) {
        out.push(b)
        out.push({ _type: 'faqBlock', _key: uid(), title: 'Ofte stillede spørgsmål', items })
        i = j; continue
      }
    }
    out.push(b); i++
  }
  return out
}

// ─── PROS / CONS ──────────────────────────────────────────────────────────────

const blockText      = (b) => (b.children?.map(c => c.text).join('') || '').trim()
const isProsHeading  = (b) => /^fordele[:\s]*/i.test(blockText(b))
const isConsHeading  = (b) => /^ulemper[:\s]*/i.test(blockText(b))
const isBulletBlock  = (b) => b._type === 'block' && b.listItem === 'bullet'
const isHeadingBlock = (b) => b._type === 'block' && ['h2','h3','h4','normal'].includes(b.style)

function groupProsConsBlocks(blocks) {
  const out = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]
    if (isHeadingBlock(b) && isProsHeading(b)) {
      const pros = []
      let j = i + 1
      while (j < blocks.length && isBulletBlock(blocks[j])) { pros.push(blockText(blocks[j])); j++ }
      let consStart = -1
      for (let k = j; k < Math.min(j + 4, blocks.length); k++) {
        if (isHeadingBlock(blocks[k]) && isConsHeading(blocks[k])) { consStart = k; break }
      }
      if (pros.length && consStart !== -1) {
        const cons = []
        let m = consStart + 1
        while (m < blocks.length && isBulletBlock(blocks[m])) { cons.push(blockText(blocks[m])); m++ }
        if (cons.length) {
          out.push({ _type: 'prosConsBlock', _key: uid(), title: 'Fordele & Ulemper', pros, cons })
          i = m; continue
        }
      }
    }
    out.push(b); i++
  }
  return out
}

// ─── TABLE ────────────────────────────────────────────────────────────────────

function parseTable(tableNode) {
  const headers = [], rows = []
  const thead = tableNode.querySelector('thead')
  if (thead) {
    thead.querySelectorAll('th, td').forEach(cell => headers.push(decodeEntities(stripHtml(cell.innerHTML))))
  } else {
    const firstRow = tableNode.querySelector('tr')
    if (firstRow) {
      const cells = firstRow.querySelectorAll('th')
      if (cells.length && cells.length === firstRow.querySelectorAll('th, td').length)
        cells.forEach(cell => headers.push(decodeEntities(stripHtml(cell.innerHTML))))
    }
  }
  const tbody = tableNode.querySelector('tbody') || tableNode
  tbody.querySelectorAll('tr').forEach(tr => {
    if (tr.closest('thead')) return
    const cells = tr.querySelectorAll('td, th').map(td => decodeEntities(stripHtml(td.innerHTML)))
    if (cells.length) rows.push({ _type: 'tableRow', _key: uid(), cells })
  })
  if (!rows.length) return null
  return { _type: 'tableBlock', _key: uid(), title: '', headers, rows }
}

// ─── HTML → PORTABLE TEXT ─────────────────────────────────────────────────────

async function htmlToPortableText(html, offerUrl = '') {
  if (!html?.trim()) return []
  const root = parse(html)
  const blocks = []

  async function process(node) {
    const tag = node.tagName?.toLowerCase()
    if (!tag) {
      if (node.text?.trim()) { const s = inlineToSpans(node); if (s.length) blocks.push(makeBlock('normal', s)) }
      return
    }
    if (tag === 'p') {
      const imgs = node.querySelectorAll('img')
      if (imgs.length === 1 && !node.text.trim()) { await process(imgs[0]); return }
      const spans = inlineToSpans(node)
      if (spans.length && spans.some(s => s.text?.trim())) blocks.push(makeBlock('normal', spans))
      return
    }
    if (['h1','h2','h3','h4','h5','h6'].includes(tag)) {
      const style = tag === 'h1' ? 'h2' : tag
      const spans = inlineToSpans(node)
      if (spans.length) blocks.push(makeBlock(style, spans))
      return
    }
    if (tag === 'blockquote') {
      const spans = inlineToSpans(node)
      if (spans.length) blocks.push(makeBlock('blockquote', spans))
      return
    }
    if (tag === 'ul' || tag === 'ol') {
      const listType = tag === 'ul' ? 'bullet' : 'number'
      node.querySelectorAll('li').forEach(li => {
        const spans = inlineToSpans(li)
        if (spans.length) blocks.push({ _type: 'block', _key: uid(), style: 'normal', listItem: listType, level: 1, markDefs: spans._markDefs || [], children: spans })
      })
      return
    }
    if (['hr','br','style','script','noscript','iframe'].includes(tag)) return
    if (tag === 'img') {
      const src = node.getAttribute('src') || ''
      const alt = node.getAttribute('alt') || ''
      if (!src) return
      const assetId = await uploadImage(src)
      if (assetId) blocks.push({ _type: 'image', _key: uid(), asset: { _type: 'reference', _ref: assetId }, alt })
      return
    }
    if (tag === 'figure') {
      const table = node.querySelector('table')
      if (table) { const t = parseTable(table); if (t) blocks.push(t); return }
      const img = node.querySelector('img')
      if (img) { await process(img); return }
      return
    }
    if (tag === 'table') { const t = parseTable(node); if (t) blocks.push(t); return }
    if (tag === 'div' || tag === 'section') {
      if (hasClass(node, 'wp-block-ht-block-toc') || hasClass(node, 'htoc')) return
      if (hasClass(node, 'wp-block-spacer') || hasClass(node, 'wp-block-separator')) return

      if (hasClass(node, 'wp-block-buttons')) {
        for (const btnWrap of node.querySelectorAll('.wp-block-button')) {
          const a = btnWrap.querySelector('a')
          if (!a) continue
          const text = decodeEntities(stripHtml(a.innerHTML))
          const url  = a.getAttribute('href') || offerUrl
          if (text && url) blocks.push({ _type: 'ctaButton', _key: uid(), text, url })
        }
        return
      }
      if (hasClass(node, 'wp-block-button')) {
        const a = node.querySelector('a')
        if (a) {
          const text = decodeEntities(stripHtml(a.innerHTML))
          const url  = a.getAttribute('href') || offerUrl
          if (text && url) blocks.push({ _type: 'ctaButton', _key: uid(), text, url })
        }
        return
      }

      const faqItems = tryParseFaqNode(node)
      if (faqItems) { blocks.push({ _type: 'faqBlock', _key: uid(), title: 'Ofte stillede spørgsmål', items: faqItems }); return }
      for (const child of node.childNodes) await process(child)
      return
    }
    if (['article','main','header','footer','aside','nav'].includes(tag)) {
      for (const child of node.childNodes) await process(child); return
    }
    const spans = inlineToSpans(node)
    if (spans.length && spans.some(s => s.text?.trim())) blocks.push(makeBlock('normal', spans))
  }

  for (const child of root.childNodes) await process(child)
  return groupFaqBlocks(groupProsConsBlocks(blocks))
}

// ─── ACF image helper ─────────────────────────────────────────────────────────
// ACF image fields return:
//   - a URL string
//   - an object with { url, alt, sizes, ... }
//   - an integer attachment ID (when ACF is set to return ID)

function acfImageUrl(val) {
  if (!val) return null
  if (typeof val === 'string' && val.startsWith('http')) return val
  if (typeof val === 'object' && val !== null) return val.url || val.sizes?.large || val.sizes?.medium_large || null
  return null
}

function acfImageAlt(val) {
  if (!val || typeof val !== 'object') return null
  return val.alt || val.title || null
}

async function acfImageUrlFromId(val) {
  // If ACF returns an integer attachment ID, fetch the media object
  if (typeof val === 'number' && val > 0) {
    const alt = await getMediaAlt(val)
    try {
      const res = await fetch(`${WP_BASE}/wp-json/wp/v2/media/${val}`)
      if (!res.ok) return { url: null, alt: null }
      const data = await res.json()
      return { url: data.source_url || null, alt: data.alt_text || data.title?.rendered || null }
    } catch { return { url: null, alt: null } }
  }
  return { url: acfImageUrl(val), alt: acfImageAlt(val) }
}

// ─── BOOKMAKER LOOKUP ─────────────────────────────────────────────────────────
// Build a map of WP post ID → Sanity bookmaker document ID from already-migrated bookmakers

async function buildBookmakerMap() {
  const results = await sanity.fetch(`*[_type == "bookmaker"]{ _id }`)
  // Our IDs are "wp-bookmaker-{wpId}" so we can reverse-map
  const map = new Map()
  for (const doc of results) {
    const match = doc._id.match(/^wp-bookmaker-(\d+)$/)
    if (match) map.set(parseInt(match[1], 10), doc._id)
  }
  return map
}

// The ACF "casino" relationship field returns either:
//   - a WP post ID (number)
//   - an array of post IDs / post objects
//   - a single post object with .ID
function resolveBookmakerRef(acfCasino, bookmakerMap) {
  if (!acfCasino) return null
  let wpId = null
  if (typeof acfCasino === 'number') wpId = acfCasino
  else if (typeof acfCasino === 'string' && /^\d+$/.test(acfCasino)) wpId = parseInt(acfCasino, 10)
  else if (Array.isArray(acfCasino) && acfCasino.length) {
    const first = acfCasino[0]
    wpId = typeof first === 'number' ? first : (first?.ID || first?.id || null)
  } else if (typeof acfCasino === 'object') {
    wpId = acfCasino.ID || acfCasino.id || null
  }
  if (!wpId) return null
  const sanityId = bookmakerMap.get(wpId)
  return sanityId ? { _type: 'reference', _ref: sanityId } : null
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎁 Migrating WordPress "Casino Bonusser" → Sanity bonus`)
  console.log(`   Project : ${PROJECT_ID} / ${DATASET}\n`)

  // Build bookmaker reference map from already-migrated bookmakers
  console.log('🔗 Building bookmaker reference map...')
  const bookmakerMap = await buildBookmakerMap()
  console.log(`   Found ${bookmakerMap.size} migrated bookmakers\n`)

  // Fetch all casino-bonusser posts
  const posts = []
  let page = 1
  while (true) {
    const url = `${WP_BASE}/wp-json/wp/v2/casino-bonusser?status=publish&per_page=100&page=${page}&_embed=1`
    const res = await fetch(url)
    if (!res.ok) break
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) break
    posts.push(...data)
    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
    console.log(`   Fetched page ${page}/${total} (${posts.length} posts so far)`)
    if (page >= total) break
    page++
  }
  console.log(`\n   Total: ${posts.length} bonus posts\n`)

  let success = 0, failed = 0

  for (const wp of posts) {
    const slug  = wp.slug
    const title = decodeEntities(wp.title?.rendered || slug)
    console.log(`\n🎁 ${slug}`)

    try {
      const acf  = wp.acf || {}
      const yoast = wp.yoast_head_json || {}

      // ── Body ──────────────────────────────────────────────────────────────
      const body = await htmlToPortableText(wp.content?.rendered || '', str(acf.offer_url) || '')

      // ── Casino logo — only from ACF logo fields, never from featured/OG image
      const { url: logoUrl, alt: logoAlt } = await acfImageUrlFromId(acf.casino_logo)
        .then(r => r.url ? r : acfImageUrlFromId(acf.casino_logo_square))
      const logoRef = logoUrl ? await uploadImage(logoUrl) : null

      // ── Campaign image ─────────────────────────────────────────────────────
      const kampagneBilledeUrl = acfImageUrl(acf.kampagne_billede)
      const kampagneBilledeRef = kampagneBilledeUrl ? await uploadImage(kampagneBilledeUrl) : null

      // ── OG image — featured image from Yoast, goes into ogImage field ──────
      const ogImageUrl = yoast.og_image?.[0]?.url
      const ogImageRef = ogImageUrl ? await uploadImage(ogImageUrl) : null
      const ogImageAlt = await getMediaAlt(wp.featured_media) || yoast.og_title || title

      // ── Bookmaker reference ───────────────────────────────────────────────
      const bookmakerRef = resolveBookmakerRef(acf.casino, bookmakerMap)

      // ── Build document ────────────────────────────────────────────────────
      const offerUrl = str(acf.offer_url)

      const doc = {
        _id:   `wp-bonus-${wp.id}`,
        _type: 'bonus',
        title,
        slug:  { _type: 'slug', current: slug },

        // Active — true only if offer URL is set
        active: !!offerUrl,

        // Bookmaker relation
        ...(bookmakerRef ? { bookmaker: bookmakerRef } : {}),

        // Core info
        ...(str(acf.casino_navn)            ? { casinoNavn: str(acf.casino_navn) }                       : {}),
        ...(offerUrl                        ? { offerUrl }                                                : {}),
        ...(str(acf.bonus_type)             ? { bonusType: str(acf.bonus_type) }                         : {}),
        ...(logoRef                         ? { casinoLogo: imageRef(logoRef, logoAlt) }                 : {}),

        // Odds bonus
        ...(str(acf.odds_bonus_titel)       ? { oddsBonusTitel: str(acf.odds_bonus_titel) }              : {}),
        ...(str(acf.odds_bonus_placering)   ? { oddsBonusPlacering: num(acf.odds_bonus_placering) }      : {}),
        ...(str(acf.minimum_odds)           ? { minimumOdds: str(acf.minimum_odds) }                     : {}),

        // Indbetalingsbonus
        ...(str(acf['indbetalingsbonus_titel'])
                                            ? { indbetalingsbonusTitel: str(acf['indbetalingsbonus_titel']) } : {}),
        ...(str(acf['indbetalingsbonus_-_beskrivelse'])
                                            ? { indbetalingsbonusBeskrivelse: str(acf['indbetalingsbonus_-_beskrivelse']) } : {}),

        // Velkomstbonus
        ...(str(acf['velkomstbonus_-_titel'])
                                            ? { velkomstbonusTitel: str(acf['velkomstbonus_-_titel']) }  : {}),
        ...(str(acf['velkomstbonus_-_beskrivelse'])
                                            ? { velkomstbonusBeskrivelse: str(acf['velkomstbonus_-_beskrivelse']) } : {}),

        // Free spins
        ...(str(acf['free_spins_-_titel'])  ? { freeSpinsTitel: str(acf['free_spins_-_titel']) }         : {}),
        ...(str(acf['free_spins_uden_indbetaling_-_titel'])
                                            ? { freeSpinsUdenIndbetalingTitel: str(acf['free_spins_uden_indbetaling_-_titel']) } : {}),
        ...(str(acf['free_spins_uden_indbetaling_-_beskrivelse'])
                                            ? { freeSpinsUdenIndbetalingBeskrivelse: str(acf['free_spins_uden_indbetaling_-_beskrivelse']) } : {}),

        // Details
        ...(str(acf.minimum_indbetaling)    ? { minimumIndbetaling: num(acf.minimum_indbetaling) }       : {}),
        ...(str(acf.gennemspilskrav)        ? { gennemspilskrav: str(acf.gennemspilskrav) }              : {}),
        ...(str(acf['spin-vaerdi'])         ? { spinVaerdi: str(acf['spin-vaerdi']) }                   : {}),
        ...(str(acf.maks_gevinst)           ? { maksGevinst: str(acf.maks_gevinst) }                    : {}),
        ...(str(acf.terms_and_conditions)   ? { terms: str(acf.terms_and_conditions) }                  : {}),
        ...(str(acf.bonuskode)              ? { bonuskode: str(acf.bonuskode) }                         : {}),
        ...(str(acf.bonukode_promo_tekst)   ? { bonuskodePromoTekst: str(acf.bonukode_promo_tekst) }    : {}),

        // Campaign
        ...(kampagneBilledeRef              ? { kampagneBillede: imageRef(kampagneBilledeRef) }          : {}),
        ...(acf.kampagne_start              ? { kampagneStart: acf.kampagne_start }                     : {}),
        ...(acf.kampagne_slut               ? { kampagneSlut: acf.kampagne_slut }                       : {}),

        // Body & SEO
        ...(body.length                     ? { body }                                                   : {}),
        ...(yoast.title                     ? { metaTitle: yoast.title }                                 : {}),
        ...(yoast.description               ? { metaDescription: yoast.description }                    : {}),
        ...(ogImageRef                      ? { ogImage: imageRef(ogImageRef, ogImageAlt) }              : {}),
      }

      await sanity.createOrReplace(doc)
      success++

      const acfFilled = Object.values(acf).filter(v => v && String(v).trim()).length
      const hasRef    = bookmakerRef ? '🔗 linked' : '⚠️  no bookmaker link'
      const parts     = [
        hasRef,
        logoRef ? '✅ logo' : '⚠️  no logo',
        `${acfFilled} acf fields`,
        body.filter(b => b._type === 'image').length     ? `${body.filter(b=>b._type==='image').length} img`     : '',
        body.filter(b => b._type === 'tableBlock').length ? `${body.filter(b=>b._type==='tableBlock').length} tbl` : '',
        body.filter(b => b._type === 'faqBlock').length   ? `${body.filter(b=>b._type==='faqBlock').length} faq`   : '',
      ].filter(Boolean).join('  ·  ')
      console.log(`   ✅ ${parts}`)

    } catch (err) {
      failed++
      console.error(`   ❌ ${err.message}`)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✨ Done! ${success} imported, ${failed} failed. ${imageCache.size} images uploaded.`)
  console.log(`\n👉 Studio: https://pokcas.vercel.app/studio`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
