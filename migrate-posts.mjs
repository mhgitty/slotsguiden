/**
 * WordPress Posts → Sanity Migration
 * - Pre-creates categories from WP
 * - Sets William West as author on all posts
 * - Handles: images (uploaded to Sanity CDN), tables, FAQ blocks, rich text
 *
 * Setup:
 *   1. Add SANITY_WRITE_TOKEN=sk... to .env.local (needs write access to your Sanity project)
 *   2. npm install @sanity/client node-html-parser  (if not already installed)
 *   3. node migrate-posts.mjs
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

// Build Basic Auth header if credentials are provided
const wpHeaders  = WP_USER && WP_PASS
  ? { Authorization: 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64') }
  : {}

if (!TOKEN) {
  console.error('\n❌  SANITY_WRITE_TOKEN is missing from .env.local')
  console.error('    Add: SANITY_WRITE_TOKEN=sk...\n')
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
const decodeEntities = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&rdquo;/g, '“').replace(/&ldquo;/g, '”')
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&hellip;/g, '…')
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

// ─── FAQ DETECTION ────────────────────────────────────────────────────────────

function tryParseFaqNode(node) {
  const c = cls(node)

  if (c.includes('schema-faq') || c.includes('yoast-faq')) {
    const items = []
    const sections = node.querySelectorAll('.schema-faq-section, [class*="faq-section"]')
    for (const s of sections) {
      const q = s.querySelector('.schema-faq-question, strong, h3, h4')
      const a = s.querySelector('.schema-faq-answer, p')
      if (q && a) items.push({ question: decodeEntities(stripHtml(q.innerHTML)), answer: decodeEntities(stripHtml(a.innerHTML)) })
    }
    if (items.length) return items
  }

  if (c.includes('rank-math-faq')) {
    const items = []
    const faqItems = node.querySelectorAll('.rank-math-faq-item, [class*="faq-item"]')
    for (const item of faqItems) {
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
        const nextTag = next?.tagName?.toLowerCase()
        if (next && ['p','div','dd'].includes(nextTag)) {
          const aText = decodeEntities(stripHtml(next.innerHTML))
          if (qText && aText) items.push({ question: qText, answer: aText })
          i += 2; continue
        }
      }
      i++
    }
    if (items.length) return items
  }

  return null
}

// ─── PROS / CONS DETECTION ────────────────────────────────────────────────────

const isProsHeading  = (b) => /^fordele[:\s]*/i.test(blockText(b))
const isConsHeading  = (b) => /^ulemper[:\s]*/i.test(blockText(b))
const blockText      = (b) => (b.children?.map(c => c.text).join('') || '').trim()
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
          items.push({
            question: qBlock.children?.map(c => c.text).join('') || '',
            answer:   aBlock.children?.map(c => c.text).join('') || '',
          })
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
      if (cells.length && cells.length === firstRow.querySelectorAll('th, td').length) {
        cells.forEach(cell => headers.push(decodeEntities(stripHtml(cell.innerHTML))))
      }
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

// ─── MAIN HTML → PORTABLE TEXT ───────────────────────────────────────────────

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

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

// Emoji map for known category slugs
const EMOJI_MAP = {
  'blog':                 '📚',
  'news':                 '📰',
  'cryptocurrency-news':  '💰',
  'entertainment':        '🎭',
  'game-developers-news': '🎮',
  'gaming':               '🎯',
  'interviews':           '🎤',
  'luxury-lifestyle':     '✨',
  'money':                '💵',
  'press-release-news':   '📢',
  'social-media':         '📱',
  'reviews':              '⭐',
  'uncategorized':        '📁',
}

/**
 * Extract unique categories from embedded post data, create them in Sanity.
 * Returns a map of WP category ID → Sanity _id.
 * (WP /categories endpoint returns 403, so we pull cat data from _embedded posts instead)
 */
async function syncCategoriesFromPosts(posts) {
  console.log('\n📂 Syncing categories from post data...')

  // Collect unique categories across all posts via wp:term
  const seen = new Map()  // wpId → {id, name, slug}
  for (const wp of posts) {
    const terms = wp._embedded?.['wp:term']?.[0] || []
    for (const term of terms) {
      if (term.taxonomy === 'category' && !seen.has(term.id)) {
        seen.set(term.id, { id: term.id, name: term.name, slug: term.slug })
      }
    }
  }

  console.log(`   Found ${seen.size} unique categories`)
  const idMap = {}  // wpId → sanity _id

  for (const cat of seen.values()) {
    const name     = decodeEntities(cat.name)
    const slug     = cat.slug
    const sanityId = `wp-cat-${cat.id}`
    const emoji    = EMOJI_MAP[slug] || '📁'

    const doc = {
      _id:   sanityId,
      _type: 'category',
      name,
      slug:  { _type: 'slug', current: slug },
      emoji,
    }

    await sanity.createOrReplace(doc)
    idMap[cat.id] = sanityId
    console.log(`   ✅ ${emoji} ${name}  (${slug})`)
  }

  console.log(`   ${Object.keys(idMap).length} categories ready\n`)
  return idMap
}

// ─── AUTHOR LOOKUP ────────────────────────────────────────────────────────────

async function getDefaultAuthorId() {
  const author = await sanity.fetch(
    `*[_type == "author"] | order(_createdAt asc) [0] { _id, name }`
  ).catch(() => null)

  if (!author) {
    console.warn('   ⚠️  No author found in Sanity — posts will have no author set')
    return null
  }
  console.log(`\n👤 Default author: ${author.name} (${author._id})`)
  return author._id
}

// ─── READING TIME ─────────────────────────────────────────────────────────────

function estimateReadingTime(html) {
  const words = stripHtml(html || '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Migrating WordPress posts → Sanity`)
  console.log(`   Project : ${PROJECT_ID} / ${DATASET}`)
  console.log(`   Source  : ${WP_BASE}`)
  console.log(`   Images  : will be uploaded to Sanity CDN`)

  // 1. Fetch all posts first (categories are embedded in post data)
  console.log('\n📡 Fetching posts from WordPress...')
  const posts = []
  let page = 1
  while (true) {
    const url = `${WP_BASE}/wp-json/wp/v2/posts?status=publish&per_page=100&page=${page}&_embed=1`
    const res = await fetch(url, { headers: wpHeaders })
    if (!res.ok) { console.log(`   HTTP ${res.status} on page ${page} — stopping`); break }
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) break
    posts.push(...data)
    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
    console.log(`   Page ${page}/${total} — ${posts.length} posts so far`)
    if (page >= total) break
    page++
  }
  console.log(`   Total: ${posts.length} posts`)

  // 2. Sync categories extracted from post embedded data
  const categoryMap = await syncCategoriesFromPosts(posts)

  // 3. Get default author
  const authorId = await getDefaultAuthorId()

  // 4. Migrate each post
  const TEST_LIMIT = process.argv.includes('--test') ? 5 : Infinity
  const subset = posts.slice(0, TEST_LIMIT)
  if (TEST_LIMIT < Infinity) console.log(`\n🧪 TEST MODE — processing first ${subset.length} posts only\n`)

  // Fetch existing Sanity post IDs to skip already-imported posts
  const existingIds = await sanity.fetch(`*[_type == "post"]._id`)
  const existingSet = new Set(existingIds)
  console.log(`\n📋 ${existingSet.size} posts already in Sanity — these will be skipped\n`)

  let success = 0, skipped = 0, failed = 0
  for (const wp of subset) {
    const slug  = wp.slug
    const title = decodeEntities(wp.title?.rendered || 'Untitled')
    const docId = `wp-post-${wp.id}`

    if (existingSet.has(docId)) {
      console.log(`\n⏭  Skipping (already imported): ${slug}`)
      skipped++
      continue
    }

    console.log(`\n📄 ${slug}`)
    console.log(`   "${title}"`)

    try {
      // Convert HTML body
      const body = await htmlToPortableText(wp.content?.rendered || '')

      // Featured image from _embedded
      let featuredImage
      try {
        const media = wp._embedded?.['wp:featuredmedia']?.[0]
        if (media?.source_url) {
          const assetId = await uploadImage(media.source_url)
          if (assetId) {
            featuredImage = {
              _type: 'image',
              asset: { _type: 'reference', _ref: assetId },
              alt: media.alt_text || media.title?.rendered || title,
            }
          }
        }
      } catch { /* featured image is optional */ }

      // Map first WP category to Sanity category
      let categoryRef
      if (wp.categories?.length) {
        const sanityId = categoryMap[wp.categories[0]]
        if (sanityId) categoryRef = { _type: 'reference', _ref: sanityId }
      }

      // Build document
      const doc = {
        _id:         `wp-post-${wp.id}`,
        _type:       'post',
        title,
        slug:        { _type: 'slug', current: slug },
        publishedAt: wp.date_gmt ? new Date(wp.date_gmt + 'Z').toISOString() : wp.date,
        lastUpdated: wp.modified_gmt ? new Date(wp.modified_gmt + 'Z').toISOString() : wp.modified,
        readingTime: estimateReadingTime(wp.content?.rendered),
        ...(wp.excerpt?.rendered ? { excerpt: decodeEntities(stripHtml(wp.excerpt.rendered)).slice(0, 300) } : {}),
        ...(body.length ? { body } : {}),
        ...(featuredImage ? { featuredImage, ogImage: featuredImage } : {}),
        ...(categoryRef ? { category: categoryRef } : {}),
        ...(authorId ? { author: { _type: 'reference', _ref: authorId } } : {}),
      }

      // Yoast SEO
      const yoast = wp.yoast_head_json
      if (yoast?.title)       doc.metaTitle       = yoast.title
      if (yoast?.description) doc.metaDescription = yoast.description

      await sanity.createOrReplace(doc)
      success++

      const images   = body.filter(b => b._type === 'image').length
      const tables   = body.filter(b => b._type === 'tableBlock').length
      const faqs     = body.filter(b => b._type === 'faqBlock').length
      const pc       = body.filter(b => b._type === 'prosConsBlock').length
      const parts = [
        images ? `${images} img`    : '',
        tables ? `${tables} table`  : '',
        faqs   ? `${faqs} faq`      : '',
        pc     ? `${pc} pros/cons`  : '',
      ].filter(Boolean).join(' · ')
      console.log(`   ✅ imported${parts ? `  [${parts}]` : ''}`)
    } catch (err) {
      failed++
      console.error(`   ❌ ${err.message}`)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✨ Done!  ${success} imported · ${skipped} skipped · ${failed} failed · ${imageCache.size} images uploaded`)
  console.log(`\n👉 Review in Studio: https://pokcas.vercel.app/studio`)
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
