/**
 * WordPress "Casinoer" CPT → Sanity bookmaker documents
 *
 * Maps per record:
 *   name          ← cleaned from slug  (e.g. "mr-green" → "Mr Green")
 *   slug          ← wp.slug
 *   logo          ← yoast og_image[0].url  (uploaded to Sanity CDN)
 *   body          ← wp.content.rendered  (full HTML → Portable Text)
 *   metaTitle     ← yoast_head_json.title
 *   metaDescription ← yoast_head_json.description
 *
 * Fields left blank for manual entry in Studio:
 *   score, usp, indbetalingsbonus, freeSpinsBonus, minIndbetaling,
 *   gennemspilskrav, trustpilot, lanceringsdato, url (affiliate), terms, intro
 *
 * Run: node migrate-bookmakers.mjs
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
const uid = () => `k${Date.now().toString(36)}${(_c++).toString(36)}`
const stripHtml = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const decodeEntities = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
const cls = (node) => node.getAttribute?.('class') || ''
const hasClass = (node, ...names) => names.some(n => cls(node).includes(n))

/** "mr-green" → "Mr Green", "leovegas" → "Leovegas" */
const slugToName = (slug) =>
  slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────

const imageCache = new Map()

async function uploadImage(src) {
  if (!src || src.startsWith('data:')) return null
  // Normalise protocol-relative URLs
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

  if (c.includes('rank-math-faq')) {
    const items = []
    for (const item of node.querySelectorAll('.rank-math-faq-item, [class*="faq-item"]')) {
      const q = item.querySelector('[class*="question"], h3, h4')
      const a = item.querySelector('[class*="answer"], p')
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
        const next = children[i + 1]
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
        const qBlock = blocks[j]
        const aBlock = blocks[j + 1]
        if (qBlock?._type === 'block' && (qBlock.style === 'h3' || qBlock.style === 'h4') &&
            aBlock?._type === 'block' && aBlock.style === 'normal') {
          items.push({ question: qBlock.children?.map(c => c.text).join('') || '', answer: aBlock.children?.map(c => c.text).join('') || '' })
          j += 2
        } else break
      }
      if (items.length >= 2) {
        out.push(b)
        out.push({ _type: 'faqBlock', _key: uid(), title: 'Ofte stillede spørgsmål', items })
        i = j
        continue
      }
    }
    out.push(b)
    i++
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
          i = m
          continue
        }
      }
    }
    out.push(b)
    i++
  }
  return out
}

// ─── TABLE ────────────────────────────────────────────────────────────────────

function parseTable(tableNode) {
  const headers = []
  const rows = []
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

async function htmlToPortableText(html) {
  if (!html?.trim()) return []
  const root = parse(html)
  const blocks = []

  async function process(node) {
    const tag = node.tagName?.toLowerCase()

    if (!tag) {
      if (node.text?.trim()) {
        const s = inlineToSpans(node)
        if (s.length) blocks.push(makeBlock('normal', s))
      }
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

    if (['hr', 'br', 'style', 'script', 'noscript', 'iframe'].includes(tag)) return

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

    if (tag === 'table') {
      const t = parseTable(node)
      if (t) blocks.push(t)
      return
    }

    if (tag === 'div' || tag === 'section') {
      if (hasClass(node, 'wp-block-ht-block-toc') || hasClass(node, 'htoc')) return
      if (hasClass(node, 'wp-block-spacer')) return
      if (hasClass(node, 'wp-block-separator')) return

      if (hasClass(node, 'wp-block-buttons')) {
        for (const btnWrap of node.querySelectorAll('.wp-block-button')) {
          const a = btnWrap.querySelector('a')
          if (!a) continue
          const text = decodeEntities(stripHtml(a.innerHTML))
          const url  = a.getAttribute('href') || ''
          if (text) blocks.push({ _type: 'ctaButton', _key: uid(), text, url })
        }
        return
      }
      if (hasClass(node, 'wp-block-button')) {
        const a = node.querySelector('a')
        if (a) {
          const text = decodeEntities(stripHtml(a.innerHTML))
          const url  = a.getAttribute('href') || ''
          if (text) blocks.push({ _type: 'ctaButton', _key: uid(), text, url })
        }
        return
      }

      const faqItems = tryParseFaqNode(node)
      if (faqItems) {
        blocks.push({ _type: 'faqBlock', _key: uid(), title: 'Ofte stillede spørgsmål', items: faqItems })
        return
      }
      for (const child of node.childNodes) await process(child)
      return
    }

    if (['article','main','header','footer','aside','nav'].includes(tag)) {
      for (const child of node.childNodes) await process(child)
      return
    }

    const spans = inlineToSpans(node)
    if (spans.length && spans.some(s => s.text?.trim())) blocks.push(makeBlock('normal', spans))
  }

  for (const child of root.childNodes) await process(child)

  const afterProsCons = groupProsConsBlocks(blocks)
  return groupFaqBlocks(afterProsCons)
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎰 Migrating WordPress "Casinoer" CPT → Sanity bookmaker`)
  console.log(`   Project : ${PROJECT_ID} / ${DATASET}`)
  console.log(`   Source  : ${WP_BASE}/wp-json/wp/v2/casinoer\n`)

  // Fetch all casinoer posts
  const posts = []
  let page = 1
  while (true) {
    const url = `${WP_BASE}/wp-json/wp/v2/casinoer?status=publish&per_page=100&page=${page}&_embed=1`
    const res = await fetch(url)
    if (!res.ok) break
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) break
    posts.push(...data)
    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
    if (page >= total) break
    page++
  }
  console.log(`   Found ${posts.length} bookmaker records\n`)

  let success = 0, failed = 0

  for (const wp of posts) {
    const slug  = wp.slug
    const name  = slugToName(slug)
    console.log(`\n🎰 ${slug} — "${name}"`)

    try {
      // ── Body content ──────────────────────────────────────────────────────
      const body = await htmlToPortableText(wp.content?.rendered || '')

      // ── ACF custom fields ─────────────────────────────────────────────────
      const acf = wp.acf || {}
      const str  = (v) => (typeof v === 'string' && v.trim()) ? v.trim() : undefined
      const num  = (v) => { const n = parseFloat(v); return isNaN(n) ? undefined : n }

      // Logo: ACF logo field first, then logo_square, then Yoast OG image
      let logoRef = null
      const acfLogoUrl = typeof acf.logo === 'string' ? acf.logo
                       : typeof acf.logo === 'object' ? (acf.logo?.url || acf.logo?.sizes?.medium || '')
                       : ''
      const acfLogoSqUrl = typeof acf.logo_square === 'string' ? acf.logo_square
                         : typeof acf.logo_square === 'object' ? (acf.logo_square?.url || '')
                         : ''
      const ogLogoUrl  = wp.yoast_head_json?.og_image?.[0]?.url || ''
      const resolvedLogoUrl = acfLogoUrl || acfLogoSqUrl || ogLogoUrl
      if (resolvedLogoUrl) logoRef = await uploadImage(resolvedLogoUrl)

      // Affiliate URL: acf.url → acf.anmeldelse_link → placeholder
      const affiliateUrl = str(acf.url) || str(acf.anmeldelse_link) || `https://pokcas.com/go/${slug}/`

      // ── SEO ───────────────────────────────────────────────────────────────
      const yoast = wp.yoast_head_json || {}

      // ── Build document ────────────────────────────────────────────────────
      const doc = {
        _id:   `wp-bookmaker-${wp.id}`,
        _type: 'bookmaker',
        name,
        slug:  { _type: 'slug', current: slug },
        url:   affiliateUrl,
        ...(logoRef                  ? { logo: { _type: 'image', asset: { _type: 'reference', _ref: logoRef } } } : {}),
        ...(str(acf.usp)             ? { usp: str(acf.usp) }                         : {}),
        ...(str(acf.indbetalingsbonus) ? { indbetalingsbonus: str(acf.indbetalingsbonus) } : {}),
        ...(str(acf.free_spins_bonus)  ? { freeSpinsBonus: str(acf.free_spins_bonus) }     : {}),
        ...(str(acf.min_indbetaling)   ? { minIndbetaling: num(acf.min_indbetaling) }      : {}),
        ...(str(acf.gennemspilskrav)   ? { gennemspilskrav: str(acf.gennemspilskrav) }     : {}),
        ...(str(acf.trustpilot)        ? { trustpilot: num(acf.trustpilot) }               : {}),
        ...(str(acf.score)             ? { score: num(acf.score) }                         : {}),
        ...(str(acf.terms)             ? { terms: str(acf.terms) }                         : {}),
        ...(acf.lanceret               ? { lanceringsdato: acf.lanceret }                  : {}),
        ...(body.length                ? { body }                                           : {}),
        ...(yoast.title                ? { metaTitle: yoast.title }                        : {}),
        ...(yoast.description          ? { metaDescription: yoast.description }            : {}),
      }

      await sanity.createOrReplace(doc)
      success++

      const images   = body.filter(b => b._type === 'image').length
      const tables   = body.filter(b => b._type === 'tableBlock').length
      const faqs     = body.filter(b => b._type === 'faqBlock').length
      const prosCons = body.filter(b => b._type === 'prosConsBlock').length
      const acfFilled = ['usp','indbetalingsbonus','free_spins_bonus','min_indbetaling',
        'gennemspilskrav','trustpilot','score','url','terms','lanceret']
        .filter(k => acf[k] && String(acf[k]).trim()).length
      const parts = [
        logoRef               ? '✅ logo'                     : '⚠️  no logo',
        `${acfFilled}/10 acf`,
        images   ? `${images} img`    : '',
        tables   ? `${tables} tbl`    : '',
        faqs     ? `${faqs} faq`      : '',
        prosCons ? `${prosCons} p/c`  : '',
      ].filter(Boolean).join('  ·  ')
      console.log(`   ✅ ${parts}`)

    } catch (err) {
      failed++
      console.error(`   ❌ ${err.message}`)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✨ Done! ${success} imported, ${failed} failed. ${imageCache.size} images uploaded.`)
  console.log(`\n⚠️  Fields to fill manually in Studio for each bookmaker:`)
  console.log(`   score, usp, indbetalingsbonus, freeSpinsBonus,`)
  console.log(`   minIndbetaling, gennemspilskrav, trustpilot,`)
  console.log(`   lanceringsdato, url (real affiliate link), terms, intro`)
  console.log(`\n👉 Studio: https://pokcas.vercel.app/studio`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
