/**
 * WordPress → Sanity post importer
 * Usage: SANITY_TOKEN=xxx node scripts/import-wp-posts.mjs
 *
 * Fetches all published posts from pokcas.com's WP REST API and creates
 * matching `post` documents in Sanity. Existing posts (matched by slug)
 * are skipped so you can re-run safely.
 */

import { createClient } from '@sanity/client'
import { JSDOM } from 'jsdom'

const WP_BASE   = 'https://pokcas.com/wp-json/wp/v2'
const PROJECT_ID = ''
const DATASET    = 'production'
const TOKEN      = process.env.SANITY_TOKEN

if (!TOKEN) {
  console.error('❌  Set SANITY_TOKEN=your_token before running')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  apiVersion: '2026-04-22',
  token:     TOKEN,
  useCdn:    false,
})

// ── HTML → Portable Text (basic) ───────────────────────────────────────────

function key() {
  return Math.random().toString(36).slice(2, 9)
}

function nodeToMarks(el) {
  const marks = []
  let node = el
  while (node && node.tagName) {
    const t = node.tagName.toLowerCase()
    if (t === 'strong' || t === 'b') marks.push('strong')
    if (t === 'em'     || t === 'i') marks.push('em')
    node = node.parentElement
  }
  return marks
}

function inlineChildren(el) {
  const spans = []
  function walk(node) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      const text = node.textContent
      if (text) {
        spans.push({
          _type: 'span',
          _key: key(),
          text,
          marks: nodeToMarks(node.parentElement),
        })
      }
    } else if (node.nodeType === 1 /* ELEMENT_NODE */) {
      const t = node.tagName.toLowerCase()
      if (t === 'a') {
        const href = node.getAttribute('href') || ''
        const markKey = key()
        // collect all text under <a> as one span
        const text = node.textContent
        spans.push({
          _type: 'span', _key: key(), text,
          marks: [...nodeToMarks(node.parentElement), markKey],
        })
        // we'll handle markDefs separately — attach to the block
        node._linkMark = { _type: 'link', _key: markKey, href }
      } else {
        for (const child of node.childNodes) walk(child)
      }
    }
  }
  walk(el)
  return spans
}

function elToBlock(el) {
  const t = el.tagName?.toLowerCase()
  if (!t) return null

  const styleMap = { h2: 'h2', h3: 'h3', h4: 'h4', blockquote: 'blockquote' }

  if (['p','h2','h3','h4','blockquote','li'].includes(t)) {
    const children = inlineChildren(el)
    if (!children.length && !el.textContent?.trim()) return null
    const markDefs = []
    function collectLinks(spans) {
      // walk the DOM to pick up link markDefs
    }
    // Gather link markDefs from the element's <a> tags
    el.querySelectorAll('a').forEach(a => {
      if (a._linkMark) markDefs.push(a._linkMark)
    })
    return {
      _type: 'block',
      _key: key(),
      style: styleMap[t] || 'normal',
      markDefs,
      children: children.length ? children : [{ _type: 'span', _key: key(), text: el.textContent || '', marks: [] }],
    }
  }

  if (t === 'ul' || t === 'ol') {
    const listItem = t === 'ol' ? 'number' : 'bullet'
    return [...el.querySelectorAll('li')].map(li => ({
      _type: 'block',
      _key: key(),
      style: 'normal',
      listItem,
      level: 1,
      markDefs: [],
      children: inlineChildren(li).length
        ? inlineChildren(li)
        : [{ _type: 'span', _key: key(), text: li.textContent || '', marks: [] }],
    }))
  }

  return null
}

function htmlToPortableText(html) {
  if (!html) return []
  const dom = new JSDOM(html)
  const body = dom.window.document.body
  const blocks = []

  for (const el of body.children) {
    const result = elToBlock(el)
    if (!result) continue
    if (Array.isArray(result)) blocks.push(...result)
    else blocks.push(result)
  }

  return blocks.filter(Boolean)
}

// ── Strip HTML tags ────────────────────────────────────────────────────────

function stripHtml(html) {
  if (!html) return ''
  return new JSDOM(html).window.document.body.textContent?.trim() ?? ''
}

// ── Fetch all WP posts (handles pagination) ────────────────────────────────

async function fetchAllPosts() {
  let page = 1
  const all = []
  while (true) {
    const url = `${WP_BASE}/posts?per_page=100&page=${page}&status=publish&_fields=id,slug,title,excerpt,content,date,modified,yoast_head_json`
    const res = await fetch(url)
    if (!res.ok) break
    const posts = await res.json()
    if (!posts.length) break
    all.push(...posts)
    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10)
    if (page >= total) break
    page++
  }
  return all
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('📥  Fetching posts from WordPress…')
  const wpPosts = await fetchAllPosts()
  console.log(`✅  Found ${wpPosts.length} published posts`)

  // Fetch existing slugs from Sanity to avoid duplicates
  const existing = await client.fetch(`*[_type == "post"]{slug}`)
  const existingSlugs = new Set(existing.map(d => d.slug?.current).filter(Boolean))
  console.log(`📋  ${existingSlugs.size} posts already in Sanity`)

  let created = 0, skipped = 0

  for (const wp of wpPosts) {
    const slug = wp.slug
    if (existingSlugs.has(slug)) {
      console.log(`  ⏭  Skipping (already exists): ${slug}`)
      skipped++
      continue
    }

    const title      = stripHtml(wp.title?.rendered)
    const excerpt    = stripHtml(wp.excerpt?.rendered)
    const body       = htmlToPortableText(wp.content?.rendered ?? '')
    const publishedAt = wp.date ? new Date(wp.date).toISOString() : undefined
    const lastUpdated = wp.modified ? new Date(wp.modified).toISOString() : undefined

    const yoast      = wp.yoast_head_json ?? {}
    const metaTitle  = yoast.title || title
    const metaDesc   = yoast.og_description || yoast.description || excerpt

    const doc = {
      _type: 'post',
      _id:   `wp-post-${wp.id}`,
      title,
      slug:  { _type: 'slug', current: slug },
      excerpt,
      body,
      publishedAt,
      lastUpdated,
      metaTitle,
      metaDescription: metaDesc,
    }

    try {
      await client.createOrReplace(doc)
      console.log(`  ✅  Imported: ${title}`)
      created++
    } catch (err) {
      console.error(`  ❌  Failed: ${title} —`, err.message)
    }
  }

  console.log(`\n🎉  Done — ${created} imported, ${skipped} skipped`)
}

main().catch(err => { console.error(err); process.exit(1) })
