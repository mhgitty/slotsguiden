/**
 * Shared WordPress → Sanity migration engine for Slotsguiden.
 * Proven HTML→Portable Text conversion (FAQ, pros/cons, tables, images, CTA)
 * lifted from the template's migrate-bookmakers.mjs, parameterised so every
 * migrate script shares one implementation.
 */
import { createClient } from '@sanity/client'
import { parse } from 'node-html-parser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── ENV ──────────────────────────────────────────────────────────────────────
export function loadEnv() {
  try {
    const raw = readFileSync(resolve('.env.local'), 'utf-8')
    const vars = {}
    for (const line of raw.split('\n')) {
      if (!line || line.trim().startsWith('#')) continue
      const [k, ...v] = line.split('=')
      if (k && v.length) vars[k.trim()] = v.join('=').trim()
    }
    return vars
  } catch { return {} }
}

export function makeSanity(env) {
  const projectId = env['NEXT_PUBLIC_SANITY_PROJECT_ID']
  const dataset = env['NEXT_PUBLIC_SANITY_DATASET'] || 'production'
  const token = env['SANITY_WRITE_TOKEN']
  if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID missing in .env.local')
  if (!token) throw new Error('SANITY_WRITE_TOKEN missing in .env.local')
  return createClient({ projectId, dataset, token, apiVersion: '2026-01-01', useCdn: false })
}

// ─── SMALL HELPERS ──────────────────────────────────────────────────────────
let _c = 0
export const uid = () => `k${Date.now().toString(36)}${(_c++).toString(36)}`
export const stripHtml = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
export const decodeEntities = (s) => String(s)
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)) } catch { return _ } })
  .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)) } catch { return _ } })
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&hellip;/g, '…')
  .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&rdquo;/g, '”').replace(/&ldquo;/g, '“')
  .replace(/&amp;/g, '&')
export const cleanText = (s) => decodeEntities(stripHtml(s))
export const slugToName = (slug) =>
  String(slug).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
const clsOf = (node) => node.getAttribute?.('class') || ''
const hasClass = (node, ...names) => names.some(n => clsOf(node).includes(n))

// ─── ENGINE FACTORY ─────────────────────────────────────────────────────────
export function createEngine({ sanity, wpBase, dryRun = false }) {
  const imageCache = new Map()
  const mediaCache = new Map()

  async function getMedia(id) {
    if (!id) return null
    if (mediaCache.has(id)) return mediaCache.get(id)
    try {
      const res = await fetch(`${wpBase}/wp-json/wp/v2/media/${id}`)
      if (!res.ok) { mediaCache.set(id, null); return null }
      const data = await res.json()
      const out = { url: data.source_url || null, alt: data.alt_text || cleanText(data.title?.rendered || '') || null }
      mediaCache.set(id, out)
      return out
    } catch { mediaCache.set(id, null); return null }
  }

  // ACF image field can be: attachment ID (number/numeric string), URL string,
  // or object { url, alt, sizes }. Returns { url, alt } or { url:null }.
  async function resolveImage(val) {
    if (val == null || val === '') return { url: null, alt: null }
    if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val))) {
      return (await getMedia(parseInt(val, 10))) || { url: null, alt: null }
    }
    if (typeof val === 'string') return { url: val, alt: null }
    if (typeof val === 'object') return { url: val.url || val.source_url || val.sizes?.medium || null, alt: val.alt || null }
    return { url: null, alt: null }
  }

  async function uploadImage(src) {
    if (!src || String(src).startsWith('data:')) return null
    if (src.startsWith('//')) src = 'https:' + src
    if (imageCache.has(src)) return imageCache.get(src)
    if (dryRun) { imageCache.set(src, 'dry-run-asset'); return 'dry-run-asset' }
    try {
      const res = await fetch(src)
      if (!res.ok) return null
      const buffer = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const filename = src.split('/').pop().split('?')[0] || 'image.jpg'
      const asset = await sanity.assets.upload('image', buffer, { contentType, filename })
      imageCache.set(src, asset._id)
      return asset._id
    } catch (err) {
      process.stdout.write(`     image skip: ${String(src).split('/').pop()} (${err.message})\n`)
      return null
    }
  }

  // Resolve an ACF image value straight to a Sanity image object (or null).
  async function imageField(val) {
    const { url, alt } = await resolveImage(val)
    if (!url) return null
    const ref = await uploadImage(url)
    if (!ref) return null
    return { _type: 'image', asset: { _type: 'reference', _ref: ref }, ...(alt ? { alt } : {}) }
  }

  // ─── inline spans ───────────────────────────────────────────────────────
  function inlineToSpans(node) {
    const spans = []
    function walk(n, marks = []) {
      if (n.nodeType === 3) {
        const text = decodeEntities(n.text)
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

  // ─── FAQ ────────────────────────────────────────────────────────────────
  function tryParseFaqNode(node) {
    const c = clsOf(node)
    if (c.includes('schema-faq') || c.includes('yoast-faq')) {
      const items = []
      for (const s of node.querySelectorAll('.schema-faq-section, [class*="faq-section"]')) {
        const q = s.querySelector('.schema-faq-question, strong, h3, h4')
        const a = s.querySelector('.schema-faq-answer, p')
        if (q && a) items.push({ _key: uid(), question: cleanText(q.innerHTML), answer: cleanText(a.innerHTML) })
      }
      if (items.length) return items
    }
    if (c.includes('faq') || c.includes('accordion')) {
      const items = []
      const children = node.childNodes.filter(n => n.tagName)
      let i = 0
      while (i < children.length) {
        const tag = children[i].tagName?.toLowerCase()
        if (['h2', 'h3', 'h4', 'dt'].includes(tag)) {
          const qText = cleanText(children[i].innerHTML)
          const next = children[i + 1]
          if (next && ['p', 'div', 'dd'].includes(next.tagName?.toLowerCase())) {
            const aText = cleanText(next.innerHTML)
            if (qText && aText) { items.push({ _key: uid(), question: qText, answer: aText }); i += 2; continue }
          }
        }
        i++
      }
      if (items.length) return items
    }
    return null
  }

  // ─── table ──────────────────────────────────────────────────────────────
  function parseTable(tableNode) {
    const headers = []
    const rows = []
    const thead = tableNode.querySelector('thead')
    if (thead) thead.querySelectorAll('th, td').forEach(cell => headers.push(cleanText(cell.innerHTML)))
    const tbody = tableNode.querySelector('tbody') || tableNode
    tbody.querySelectorAll('tr').forEach(tr => {
      if (tr.closest && tr.closest('thead')) return
      const cells = tr.querySelectorAll('td, th').map(td => cleanText(td.innerHTML))
      if (cells.length) rows.push({ _type: 'tableRow', _key: uid(), cells })
    })
    if (!rows.length) return null
    return { _type: 'tableBlock', _key: uid(), title: '', headers, rows }
  }

  // ─── pros / cons grouping ─────────────────────────────────────────────────
  const blockText = (b) => (b.children?.map(c => c.text).join('') || '').trim()
  function groupProsCons(blocks) {
    const isBullet = (b) => b._type === 'block' && b.listItem === 'bullet'
    const isPros = (b) => /^fordele[:\s]*/i.test(blockText(b))
    const isCons = (b) => /^ulemper[:\s]*/i.test(blockText(b))
    const out = []
    let i = 0
    while (i < blocks.length) {
      const b = blocks[i]
      if (b._type === 'block' && isPros(b)) {
        const pros = []; let j = i + 1
        while (j < blocks.length && isBullet(blocks[j])) { pros.push(blockText(blocks[j])); j++ }
        let consStart = -1
        for (let k = j; k < Math.min(j + 4, blocks.length); k++) if (blocks[k]._type === 'block' && isCons(blocks[k])) { consStart = k; break }
        if (pros.length && consStart !== -1) {
          const cons = []; let m = consStart + 1
          while (m < blocks.length && isBullet(blocks[m])) { cons.push(blockText(blocks[m])); m++ }
          if (cons.length) { out.push({ _type: 'prosConsBlock', _key: uid(), title: 'Fordele & Ulemper', pros, cons }); i = m; continue }
        }
      }
      out.push(b); i++
    }
    return out
  }

  // ─── html → portable text ─────────────────────────────────────────────────
  async function htmlToPortableText(html) {
    if (!html || !html.trim()) return []
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
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const style = tag === 'h1' ? 'h2' : tag
        const spans = inlineToSpans(node)
        if (spans.length) blocks.push(makeBlock(style, spans))
        return
      }
      if (tag === 'blockquote') { const s = inlineToSpans(node); if (s.length) blocks.push(makeBlock('blockquote', s)); return }
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
        const ref = await uploadImage(src)
        if (ref) blocks.push({ _type: 'image', _key: uid(), asset: { _type: 'reference', _ref: ref }, ...(alt ? { alt } : {}) })
        return
      }
      if (tag === 'figure') {
        const table = node.querySelector('table'); if (table) { const t = parseTable(table); if (t) blocks.push(t); return }
        const img = node.querySelector('img'); if (img) { await process(img); return }
        return
      }
      if (tag === 'table') { const t = parseTable(node); if (t) blocks.push(t); return }
      if (tag === 'div' || tag === 'section') {
        if (hasClass(node, 'wp-block-ht-block-toc', 'htoc', 'wp-block-spacer', 'wp-block-separator')) return
        if (hasClass(node, 'wp-block-button', 'wp-block-buttons')) {
          for (const btnWrap of node.querySelectorAll('.wp-block-button')) {
            const a = btnWrap.querySelector('a'); if (!a) continue
            const text = cleanText(a.innerHTML); const url = a.getAttribute('href') || ''
            if (text && url) blocks.push({ _type: 'ctaButton', _key: uid(), text, url })
          }
          return
        }
        const faqItems = tryParseFaqNode(node)
        if (faqItems) { blocks.push({ _type: 'faqBlock', _key: uid(), title: 'Ofte stillede spørgsmål', items: faqItems }); return }
        for (const child of node.childNodes) await process(child)
        return
      }
      if (['article', 'main', 'header', 'footer', 'aside', 'nav'].includes(tag)) {
        for (const child of node.childNodes) await process(child)
        return
      }
      const spans = inlineToSpans(node)
      if (spans.length && spans.some(s => s.text?.trim())) blocks.push(makeBlock('normal', spans))
    }
    for (const child of root.childNodes) await process(child)
    return groupProsCons(blocks)
  }

  return { htmlToPortableText, uploadImage, imageField, resolveImage, getMedia }
}

// ─── FETCH ALL RECORDS OF A CPT ───────────────────────────────────────────────
export async function fetchAllCPT(wpBase, restBase, limit = 0) {
  const posts = []
  let page = 1
  while (true) {
    const url = `${wpBase}/wp-json/wp/v2/${restBase}?status=publish&per_page=100&page=${page}&_embed=1`
    const res = await fetch(url)
    if (!res.ok) break
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) break
    posts.push(...data)
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
    if (limit && posts.length >= limit) break
    if (page >= totalPages) break
    page++
  }
  return limit ? posts.slice(0, limit) : posts
}

// ─── VALUE HELPERS ────────────────────────────────────────────────────────────
export const str = (v) => (typeof v === 'string' && v.trim()) ? v.trim() : (typeof v === 'number' ? String(v) : undefined)
export const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? undefined : n }
export const text = (v) => { const t = cleanText(v || ''); return t || undefined }

// Normalise an ACF relationship value to an array of WP post IDs.
export function toIds(val) {
  if (val == null || val === '') return []
  const arr = Array.isArray(val) ? val : [val]
  const ids = []
  for (const it of arr) {
    if (typeof it === 'number') ids.push(it)
    else if (typeof it === 'string' && /^\d+$/.test(it)) ids.push(parseInt(it, 10))
    else if (it && typeof it === 'object') { const id = it.ID || it.id; if (id) ids.push(parseInt(id, 10)) }
  }
  return ids
}
// _weak: true — migration references don't require the target to exist yet
// (handles cross-type links and circular casino↔bonus refs, and partial runs).
export const refArray = (prefix, val) => {
  const ids = toIds(val)
  return ids.length ? ids.map(id => ({ _type: 'reference', _ref: `${prefix}-${id}`, _key: uid(), _weak: true })) : undefined
}
export const singleRef = (prefix, val) => {
  const ids = toIds(val)
  return ids.length ? { _type: 'reference', _ref: `${prefix}-${ids[0]}`, _weak: true } : undefined
}
