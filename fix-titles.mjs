/**
 * Fix HTML entities in post titles, excerpts, and meta fields already in Sanity.
 * Run after migration: node fix-titles.mjs
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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

const sanity = createClient({ projectId: PROJECT_ID, dataset: DATASET, token: TOKEN, apiVersion: '2026-01-01', useCdn: false })

const decode = (s) => {
  if (!s) return s
  return s
    .replace(/&#(\d+);/g,      (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '“').replace(/&ldquo;/g, '”')
    .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
}

async function main() {
  console.log('\n🔧 Fixing HTML entities in Sanity posts...\n')

  const posts = await sanity.fetch(
    `*[_type == "post" && _id match "wp-post-*"] { _id, title, excerpt, metaTitle, metaDescription }`
  )
  console.log(`   Found ${posts.length} posts to check\n`)

  let fixed = 0
  for (const post of posts) {
    const patch = {}
    const t  = decode(post.title)
    const e  = decode(post.excerpt)
    const mt = decode(post.metaTitle)
    const md = decode(post.metaDescription)

    if (t  !== post.title)           patch.title           = t
    if (e  !== post.excerpt)         patch.excerpt         = e
    if (mt !== post.metaTitle)       patch.metaTitle       = mt
    if (md !== post.metaDescription) patch.metaDescription = md

    if (Object.keys(patch).length) {
      await sanity.patch(post._id).set(patch).commit()
      console.log(`   ✅ ${post._id.replace('wp-post-', '')}  "${patch.title || post.title}"`)
      fixed++
    }
  }

  console.log(`\n✨ Done — ${fixed} posts updated, ${posts.length - fixed} were already clean.`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
