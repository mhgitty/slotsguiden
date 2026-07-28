/**
 * Migrate WordPress frontpage body → Sanity homepage singleton
 *
 * Only patches the `body` field — leaves heroHeading, intro, SEO etc. untouched.
 * Run: node migrate-homepage.mjs
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

// ─── UTILITIES (copied from migrate-pages.mjs) ────────────────────────────────

let _c = 0
const uid = () => `k${Date.now().toString(36)}${(_c++).toString(36)}`
const stripHtml = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const decodeEntities = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
const cls = (node) => node.getAttribute?.('class') || ''
const hasClass = (node, ...names) => names.some(n => cls(node).includes(n))

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────

const imageCache = new Map()

async function uploadImage(src) {
  if (!src || src.startsWith('data:')) return null
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
        i = j
        continue
      }
    }
    out.push(b)
    i++
  }
  return out
}

// ─── PROS / CONS DETECTION ────────────────────────────────────────────────────

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
      while (j < blocks.length && isBulletBlock(blocks[j])) {
        pros.push(blockText(blocks[j]))
        j++
      }
      let consStart = -1
      for (let k = j; k < Math.min(j + 4, blocks.length); k++) {
        if (isHeadingBlock(blocks[k]) && isConsHeading(blocks[k])) {
          consStart = k
          break
        }
      }
      if (pros.length && consStart !== -1) {
        const cons = []
        let m = consStart + 1
        while (m < blocks.length && isBulletBlock(blocks[m])) {
          cons.push(blockText(blocks[m]))
          m++
        }
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

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏠 Migrating WordPress frontpage body → Sanity homepage`)
  console.log(`   Project : ${PROJECT_ID} / ${DATASET}\n`)

  // Step 1: find the front page ID from WP settings
  let frontPageId = null
  try {
    const settingsRes = await fetch(`${WP_BASE}/wp-json/wp/v2/settings`)
    if (settingsRes.ok) {
      const settings = await settingsRes.json()
      frontPageId = settings.page_on_front || null
      if (frontPageId) console.log(`   Front page ID from settings: ${frontPageId}`)
    }
  } catch { /* settings endpoint may require auth */ }

  // Step 2: if we didn't get the ID, find by page whose link === base URL
  let wpPage = null
  if (frontPageId) {
    const res = await fetch(`${WP_BASE}/wp-json/wp/v2/pages/${frontPageId}?_embed=1`)
    if (res.ok) wpPage = await res.json()
  }

  if (!wpPage) {
    console.log('   Falling back: scanning pages for front page link…')
    let page = 1
    outer: while (true) {
      const res = await fetch(`${WP_BASE}/wp-json/wp/v2/pages?status=publish&per_page=100&page=${page}&_embed=1`)
      if (!res.ok) break
      const data = await res.json()
      if (!Array.isArray(data) || !data.length) break
      for (const p of data) {
        const link = (p.link || '').replace(/\/$/, '')
        const base = WP_BASE.replace(/\/$/, '')
        if (link === base) { wpPage = p; break outer }
      }
      const total = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
      if (page >= total) break
      page++
    }
  }

  if (!wpPage) {
    console.error('❌ Could not find the WordPress front page. Check WP_BASE or try providing a page slug.')
    process.exit(1)
  }

  const title = decodeEntities(wpPage.title?.rendered || 'Forside')
  console.log(`\n📄 Found front page: "${title}" (id: ${wpPage.id}, slug: ${wpPage.slug})\n`)

  console.log('⚙️  Converting content…')
  const body = await htmlToPortableText(wpPage.content?.rendered || '')

  const images   = body.filter(b => b._type === 'image').length
  const tables   = body.filter(b => b._type === 'tableBlock').length
  const faqs     = body.filter(b => b._type === 'faqBlock').length
  const prosCons = body.filter(b => b._type === 'prosConsBlock').length
  const blocks   = body.filter(b => b._type === 'block').length
  console.log(`   Blocks  : ${blocks}`)
  console.log(`   Images  : ${images}`)
  console.log(`   Tables  : ${tables}`)
  console.log(`   FAQs    : ${faqs}`)
  console.log(`   ProsCons: ${prosCons}`)
  console.log(`   Total   : ${body.length}\n`)

  if (!body.length) {
    console.warn('⚠️  No body content found — aborting to avoid clearing existing content.')
    process.exit(0)
  }

  // Ensure the singleton document exists before patching
  await sanity.createIfNotExists({ _id: 'homepage', _type: 'homepage' })

  // Patch ONLY the body field — leaves hero, SEO, howItWorks intact
  await sanity.patch('homepage').set({ body }).commit()

  console.log(`✅ Homepage body updated in Sanity!`)
  console.log(`   ${imageCache.size} image(s) uploaded to CDN`)
  console.log(`\n👉 Review: https://pokcas.vercel.app/studio`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
