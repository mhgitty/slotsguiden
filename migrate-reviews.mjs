/**
 * WordPress Affiliates (Casino Reviews) → Sanity bookmaker Migration
 *
 * Imports: title, slug, body, featured image (→ logo + ogImage), excerpt (→ intro), Yoast SEO
 * Leaves blank for manual fill in Studio: score, usp, bonus fields, affiliate URL, terms
 *
 * Setup: ensure .env.local has SANITY_WRITE_TOKEN, WP_USER, WP_APP_PASSWORD
 * Run:   node migrate-reviews.mjs
 */

import { createClient } from '@sanity/client'
import { parse } from 'node-html-parser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── CONFIG ──────────────────────────────────────────────────────────────────

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
const PROJECT_ID = env['NEXT_PUBLIC_SANITY_PROJECT_ID'] || ''
const DATASET    = env['NEXT_PUBLIC_SANITY_DATASET']    || 'production'
const TOKEN      = env['SANITY_WRITE_TOKEN']
const WP_USER    = env['WP_USER']
const WP_PASS    = env['WP_APP_PASSWORD']

const wpHeaders  = WP_USER && WP_PASS
  ? { Authorization: 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64') }
  : {}

if (!TOKEN) {
  console.error('\n❌  SANITY_WRITE_TOKEN is missing from .env.local\n')
  process.exit(1)
}

const sanity = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  token: TOKEN,
  apiVersion: '2026-01-01',
  useCdn: false,
})

const WP_BASE = 'https://pokcas.com'

// ─── UTILITIES ───────────────────────────────────────────────────────────────

let _c = 0
const uid = () => `k${Date.now().toString(36)}${(_c++).toString(36)}`
const stripHtml = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const decodeEntities = (s) => {
  if (!s) return s
  return s
    .replace(/&#(\d+);/g,         (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '“').replace(/&ldquo;/g, '”')
    .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
}
const cls = (node) => node.getAttribute?.('class') || ''
const hasClass = (node, ...names) => names.some(n => cls(node).includes(n))

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────

const imageCache = new Map()

async function uploadImage(src) {
  if (!src || src.startsWith('data:')) return null
  if (imageCache.has(src)) return imageCache.get(src)
  try {
    const headers = src.startsWith(WP_BASE) ? wpHeaders : {}
    const res = await fetch(src, { headers })
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

// ─── TABLE PARSING ────────────────────────────────────────────────────────────

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

// ─── FAQ DETECTION ────────────────────────────────────────────────────────────

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
  return null
}

// ─── HTML → PORTABLE TEXT ─────────────────────────────────────────────────────

async function htmlToPortableText(html) {
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
      if (hasClass(node, 'wp-block-ht-block-toc', 'htoc', 'wp-block-spacer', 'wp-block-separator')) return
      if (hasClass(node, 'wp-block-buttons')) {
        for (const btnWrap of node.querySelectorAll('.wp-block-button')) {
          const a = btnWrap.querySelector('a')
          if (a) { const text = decodeEntities(stripHtml(a.innerHTML)); const url = a.getAttribute('href') || ''; if (text) blocks.push({ _type: 'ctaButton', _key: uid(), text, url }) }
        }
        return
      }
      if (hasClass(node, 'wp-block-button')) {
        const a = node.querySelector('a')
        if (a) { const text = decodeEntities(stripHtml(a.innerHTML)); const url = a.getAttribute('href') || ''; if (text) blocks.push({ _type: 'ctaButton', _key: uid(), text, url }) }
        return
      }
      const faqItems = tryParseFaqNode(node)
      if (faqItems) { blocks.push({ _type: 'faqBlock', _key: uid(), title: 'Ofte stillede spørgsmål', items: faqItems }); return }
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
  return blocks
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎰 Migrating WordPress Affiliates (Casino Reviews) → Sanity bookmaker`)
  console.log(`   Project : ${PROJECT_ID} / ${DATASET}`)
  console.log(`   Source  : ${WP_BASE}/wp-json/wp/v2/affiliates\n`)

  // Fetch all reviews
  const reviews = []
  let page = 1
  while (true) {
    const url = `${WP_BASE}/wp-json/wp/v2/affiliates?status=publish&per_page=100&page=${page}&_embed=1`
    const res = await fetch(url, { headers: wpHeaders })
    if (!res.ok) { console.log(`HTTP ${res.status} — stopping`); break }
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) break
    reviews.push(...data)
    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
    console.log(`   Page ${page}/${total} — ${reviews.length} reviews fetched`)
    if (page >= total) break
    page++
  }
  console.log(`   Total: ${reviews.length} reviews\n`)

  const TEST_LIMIT = process.argv.includes('--test') ? 3 : Infinity
  const subset = reviews.slice(0, TEST_LIMIT)
  if (TEST_LIMIT < Infinity) console.log(`🧪 TEST MODE — processing first ${subset.length} only\n`)

  let success = 0, failed = 0

  for (const wp of subset) {
    const slug  = wp.slug
    const name  = decodeEntities(wp.title?.rendered || 'Untitled')
    console.log(`\n🎰 ${slug}`)
    console.log(`   "${name}"`)

    try {
      // Body
      const body = await htmlToPortableText(wp.content?.rendered || '')

      // Intro from excerpt
      const intro = wp.excerpt?.rendered
        ? decodeEntities(stripHtml(wp.excerpt.rendered)).slice(0, 400)
        : undefined

      // Featured image → logo + ogImage
      let logo, ogImage
      try {
        const media = wp._embedded?.['wp:featuredmedia']?.[0]
        if (media?.source_url) {
          const assetId = await uploadImage(media.source_url)
          if (assetId) {
            const imgObj = { _type: 'image', asset: { _type: 'reference', _ref: assetId }, alt: media.alt_text || name }
            logo = imgObj
            ogImage = imgObj
          }
        }
      } catch { /* optional */ }

      const doc = {
        _id:   `wp-affiliate-${wp.id}`,
        _type: 'bookmaker',
        name,
        titel: name,
        slug:  { _type: 'slug', current: slug },
        // url is required in schema — placeholder until filled in Studio
        url:   wp.link || 'https://pokcas.com',
        ...(intro    ? { intro }    : {}),
        ...(body.length ? { body }  : {}),
        ...(logo     ? { logo }     : {}),
        ...(ogImage  ? { ogImage }  : {}),
      }

      // Yoast SEO
      const yoast = wp.yoast_head_json
      if (yoast?.title)       doc.metaTitle       = decodeEntities(yoast.title)
      if (yoast?.description) doc.metaDescription = decodeEntities(yoast.description)

      await sanity.createOrReplace(doc)
      success++

      const images = body.filter(b => b._type === 'image').length
      const tables = body.filter(b => b._type === 'tableBlock').length
      const faqs   = body.filter(b => b._type === 'faqBlock').length
      const parts  = [images ? `${images} img` : '', tables ? `${tables} table` : '', faqs ? `${faqs} faq` : ''].filter(Boolean).join(' · ')
      console.log(`   ✅ imported${parts ? `  [${parts}]` : ''}`)
    } catch (err) {
      failed++
      console.error(`   ❌ ${err.message}`)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✨ Done!  ${success} imported · ${failed} failed · ${imageCache.size} images uploaded`)
  console.log(`\n⚠️  Remember to fill in Studio for each review:`)
  console.log(`   • Affiliate URL  • Score  • USP  • Bonus info  • Terms`)
  console.log(`\n👉 https://pokcas.vercel.app/studio`)
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
