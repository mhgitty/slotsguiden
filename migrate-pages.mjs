/**
 * WordPress Pages → Sanity Migration
 * Handles: images (uploaded to Sanity CDN), tables, FAQ blocks, rich text
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

const sanity = createClient({ projectId: PROJECT_ID, dataset: DATASET, token: TOKEN, apiVersion: '2026-01-01', useCdn: false })

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
    .replace(/&rsquo;/g, ''').replace(/&lsquo;/g, ''')
    .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
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
    const headers = src.startsWith('https://pokcas.com') ? wpHeaders : {}
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

/**
 * Try to parse a node as a Yoast/Rankmath/generic FAQ block.
 * Returns an array of {question, answer} pairs, or null if not detected.
 */
function tryParseFaqNode(node) {
  const c = cls(node)

  // ── Yoast FAQ block ──────────────────────────────────────────────────────
  // <div class="schema-faq wp-block-yoast-faq-block">
  //   <div class="schema-faq-section">
  //     <strong class="schema-faq-question">Q?</strong>
  //     <p class="schema-faq-answer">A.</p>
  //   </div>
  // </div>
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

  // ── RankMath FAQ block ────────────────────────────────────────────────────
  // <div class="rank-math-faq-items">
  //   <div class="rank-math-faq-item">
  //     <h3 class="rank-math-question">Q?</h3>
  //     <p class="rank-math-answer">A.</p>
  //   </div>
  // </div>
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

  // ── Generic accordion / FAQ plugin ───────────────────────────────────────
  // Any div whose class contains "faq" with child h3/h4 + p pairs
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
          i += 2
          continue
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

/**
 * Group Fordele: [bullets] Ulemper: [bullets] into a prosConsBlock.
 * Handles:
 *  - <p><strong>Fordele:</strong></p> / <h2>Fordele</h2> followed by a bullet list
 *  - Same for Ulemper
 * The two sections must appear within 4 non-bullet blocks of each other.
 */
function groupProsConsBlocks(blocks) {
  const out = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]

    if (isHeadingBlock(b) && isProsHeading(b)) {
      // Collect pros bullets immediately after
      const pros = []
      let j = i + 1
      while (j < blocks.length && isBulletBlock(blocks[j])) {
        pros.push(blockText(blocks[j]))
        j++
      }

      // Scan up to 4 non-bullet blocks ahead for the Ulemper heading
      let consStart = -1
      for (let k = j; k < Math.min(j + 4, blocks.length); k++) {
        if (isHeadingBlock(blocks[k]) && isConsHeading(blocks[k])) {
          consStart = k
          break
        }
      }

      if (pros.length && consStart !== -1) {
        // Collect cons bullets after the Ulemper heading
        const cons = []
        let m = consStart + 1
        while (m < blocks.length && isBulletBlock(blocks[m])) {
          cons.push(blockText(blocks[m]))
          m++
        }

        if (cons.length) {
          out.push({ _type: 'prosConsBlock', _key: uid(), title: 'Fordele & Ulemper', pros, cons })
          i = m  // skip all consumed blocks
          continue
        }
      }
    }

    out.push(b)
    i++
  }
  return out
}

/**
 * After building the flat block list, look for consecutive h3+normal block
 * pairs under an h2 that contains "FAQ" — group them into a faqBlock.
 */
function groupFaqBlocks(blocks) {
  const out = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]
    // Look for an h2/h3 that says FAQ / Ofte stillede spørgsmål
    const text = b.children?.map(c => c.text).join('').toLowerCase() || ''
    if (b._type === 'block' && b.style === 'h2' && (text.includes('faq') || text.includes('ofte stillede') || text.includes('spørgsmål'))) {
      // Collect h3+p pairs that follow
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
        out.push(b) // keep the FAQ heading
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

// ─── TABLE PARSING ────────────────────────────────────────────────────────────

function parseTable(tableNode) {
  const headers = []
  const rows = []

  // Headers from thead or first tr if it only contains th
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

  // Body rows
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

    // ── Text nodes ──────────────────────────────────────────────────────────
    if (!tag) {
      if (node.text?.trim()) {
        const s = inlineToSpans(node)
        if (s.length) blocks.push(makeBlock('normal', s))
      }
      return
    }

    // ── Paragraphs ──────────────────────────────────────────────────────────
    if (tag === 'p') {
      // p that only contains an img → treat as image
      const imgs = node.querySelectorAll('img')
      if (imgs.length === 1 && !node.text.trim()) { await process(imgs[0]); return }
      const spans = inlineToSpans(node)
      if (spans.length && spans.some(s => s.text?.trim())) blocks.push(makeBlock('normal', spans))
      return
    }

    // ── Headings ────────────────────────────────────────────────────────────
    if (['h1','h2','h3','h4','h5','h6'].includes(tag)) {
      const style = tag === 'h1' ? 'h2' : tag
      const spans = inlineToSpans(node)
      if (spans.length) blocks.push(makeBlock(style, spans))
      return
    }

    // ── Blockquote ──────────────────────────────────────────────────────────
    if (tag === 'blockquote') {
      const spans = inlineToSpans(node)
      if (spans.length) blocks.push(makeBlock('blockquote', spans))
      return
    }

    // ── Lists ────────────────────────────────────────────────────────────────
    if (tag === 'ul' || tag === 'ol') {
      const listType = tag === 'ul' ? 'bullet' : 'number'
      node.querySelectorAll('li').forEach(li => {
        const spans = inlineToSpans(li)
        if (spans.length) blocks.push({ _type: 'block', _key: uid(), style: 'normal', listItem: listType, level: 1, markDefs: spans._markDefs || [], children: spans })
      })
      return
    }

    // ── Skip decorative / no-content elements ────────────────────────────────
    if (['hr', 'br', 'style', 'script', 'noscript', 'iframe'].includes(tag)) return

    // ── Images ───────────────────────────────────────────────────────────────
    if (tag === 'img') {
      const src = node.getAttribute('src') || ''
      const alt = node.getAttribute('alt') || ''
      if (!src) return
      const assetId = await uploadImage(src)
      if (assetId) blocks.push({ _type: 'image', _key: uid(), asset: { _type: 'reference', _ref: assetId }, alt })
      return
    }

    // ── Figure (WP image block) ───────────────────────────────────────────
    if (tag === 'figure') {
      const table = node.querySelector('table')
      if (table) { const t = parseTable(table); if (t) blocks.push(t); return }
      const img = node.querySelector('img')
      if (img) { await process(img); return }
      return
    }

    // ── Tables ───────────────────────────────────────────────────────────────
    if (tag === 'table') {
      const t = parseTable(node)
      if (t) blocks.push(t)
      return
    }

    // ── FAQ blocks (Yoast, RankMath, generic) ────────────────────────────────
    if (tag === 'div' || tag === 'section') {
      // Skip Heroic Table of Contents (generated automatically on new site)
      if (hasClass(node, 'wp-block-ht-block-toc') || hasClass(node, 'htoc')) return
      // Skip WP spacer blocks
      if (hasClass(node, 'wp-block-spacer')) return
      // Skip WP separator/divider blocks
      if (hasClass(node, 'wp-block-separator')) return

      // ── WP Button blocks ───────────────────────────────────────────────────
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
      // Single button div
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
      // recurse into generic divs/sections
      for (const child of node.childNodes) await process(child)
      return
    }

    // ── Other containers ────────────────────────────────────────────────────
    if (['article','main','header','footer','aside','nav'].includes(tag)) {
      for (const child of node.childNodes) await process(child)
      return
    }

    // ── Fallback ────────────────────────────────────────────────────────────
    const spans = inlineToSpans(node)
    if (spans.length && spans.some(s => s.text?.trim())) blocks.push(makeBlock('normal', spans))
  }

  for (const child of root.childNodes) await process(child)

  // Post-process: detect & merge pros/cons sections
  const afterProsCons = groupProsConsBlocks(blocks)
  // Post-process: group consecutive h3+p FAQ pairs under FAQ headings
  return groupFaqBlocks(afterProsCons)
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Migrating WordPress pages → Sanity`)
  console.log(`   Project : ${PROJECT_ID} / ${DATASET}`)
  console.log(`   Source  : https://pokcas.com`)
  console.log(`   Images  : will be uploaded to Sanity CDN\n`)

  console.log('📡 Fetching pages from WordPress...')
  const pages = []
  let page = 1
  while (true) {
    const url = `https://pokcas.com/wp-json/wp/v2/pages?status=publish&per_page=100&page=${page}&_embed=1`
    const res = await fetch(url, { headers: wpHeaders })
    if (!res.ok || res.status === 400) break
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) break
    pages.push(...data)
    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
    if (page >= total) break
    page++
  }
  console.log(`   Found ${pages.length} pages\n`)

  let success = 0, failed = 0
  for (const wp of pages) {
    const slug  = wp.slug
    const title = decodeEntities(wp.title?.rendered || 'Untitled')
    console.log(`\n📄 ${slug} — "${title}"`)
    try {
      const body = await htmlToPortableText(wp.content?.rendered || '')

      const doc = {
        _id:   `wp-page-${wp.id}`,
        _type: 'page',
        title,
        slug:  { _type: 'slug', current: slug },
        body:  body.length ? body : undefined,
      }

      const yoast = wp.yoast_head_json
      if (yoast?.title)       doc.metaTitle = yoast.title
      if (yoast?.description) doc.metaDescription = yoast.description

      await sanity.createOrReplace(doc)
      success++
      const images    = body.filter(b => b._type === 'image').length
      const tables    = body.filter(b => b._type === 'tableBlock').length
      const faqs      = body.filter(b => b._type === 'faqBlock').length
      const prosCons  = body.filter(b => b._type === 'prosConsBlock').length
      const parts = [
        images   ? `${images} image(s)`   : '',
        tables   ? `${tables} table(s)`   : '',
        faqs     ? `${faqs} FAQ(s)`       : '',
        prosCons ? `${prosCons} pros/cons` : '',
      ].filter(Boolean).join(' · ')
      console.log(`   ✅ imported${parts ? `  · ${parts}` : ''}`)
    } catch (err) {
      failed++
      console.error(`   ❌ ${err.message}`)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✨ Done! ${success} imported, ${failed} failed. ${imageCache.size} images uploaded.`)
  console.log(`\n👉 Review in Studio: https://pokcas.vercel.app/studio`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
