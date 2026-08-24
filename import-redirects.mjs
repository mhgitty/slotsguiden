/**
 * Import Yoast (or any) 301 redirects into Sanity as `pageRedirect` documents.
 *
 * The site's middleware already reads pageRedirect docs and issues 301s, so once
 * these exist the redirects go live (5-min cache). This script only CREATES new
 * redirect docs — it never touches your pages or other content, and it skips any
 * `from` path that already has a redirect, so manual entries are safe.
 *
 * It accepts whatever you can export from WordPress:
 *   • CSV   — Yoast "Redirects → Import/Export" export, or any old,new CSV
 *   • JSON  — the Yoast option `wpseo-premium-redirects-base`
 *             (wp-cli:  wp option get wpseo-premium-redirects-base --format=json > redirects.json)
 *             or a simple [{ "from": "/a/", "to": "/b/" }, …] array
 *   • TEXT  — an .htaccess / nginx style list ("Redirect 301 /old /new", "301 /old /new")
 *
 * Only plain 301 redirects are imported. Regex redirects are reported and skipped
 * (they can't map to a fixed from→to and would need middleware logic instead).
 *
 * Usage (from project root, needs .env.local with SANITY_WRITE_TOKEN):
 *   node import-redirects.mjs redirects.csv --dry-run     # preview, writes NOTHING  ← first
 *   node import-redirects.mjs redirects.csv               # create the redirect docs
 *   node import-redirects.mjs redirects.json --limit=20   # first 20 (safe test)
 *   node import-redirects.mjs --undo                       # delete everything THIS script imported
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { loadEnv, makeSanity } from './migrate-lib.mjs'

const ID_PREFIX = 'yoast-redirect-' // marks docs created by this script (for --undo)

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const undo = argv.includes('--undo')
const limitArg = argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) || 0 : 0
const file = argv.find((a) => !a.startsWith('--'))

const idFor = (from) => ID_PREFIX + createHash('sha1').update(from).digest('hex').slice(0, 24)

// ── Normalisation ─────────────────────────────────────────────────────────────
function normFrom(raw) {
  let s = String(raw || '').trim()
  if (!s) return ''
  // strip a leading domain if present
  s = s.replace(/^https?:\/\/[^/]+/i, '')
  if (!s.startsWith('/')) s = '/' + s
  return s
}
function normTo(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s // full URL — keep as-is
  return s.startsWith('/') ? s : '/' + s
}

// ── Parsers ───────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []
  // Detect header
  const first = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim())
  // Includes Danish headers: kilde = source, mål = target.
  const fromKeys = ['origin', 'source', 'from', 'old', 'old_url', 'old url', 'source url', 'kilde']
  const toKeys = ['target', 'url', 'to', 'new', 'new_url', 'new url', 'target url', 'destination', 'mål', 'maal']
  const typeKeys = ['type', 'status', 'code']
  const formatKeys = ['format']
  const hasHeader = first.some((h) => [...fromKeys, ...toKeys].includes(h))
  let fromIdx = 0, toIdx = 1, typeIdx = -1, formatIdx = -1
  let start = 0
  if (hasHeader) {
    fromIdx = first.findIndex((h) => fromKeys.includes(h))
    toIdx = first.findIndex((h) => toKeys.includes(h))
    typeIdx = first.findIndex((h) => typeKeys.includes(h))
    formatIdx = first.findIndex((h) => formatKeys.includes(h))
    start = 1
  }
  const out = []
  for (let i = start; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const from = cols[fromIdx]
    const to = cols[toIdx]
    const type = typeIdx >= 0 ? cols[typeIdx] : '301'
    const format = formatIdx >= 0 ? cols[formatIdx] : undefined
    if (from && to) out.push({ from, to, type, format })
  }
  return out
}

function splitCsvLine(line) {
  const out = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ
    } else if ((c === ',' || c === ';' || c === '\t') && !inQ) {
      out.push(cur); cur = ''
    } else cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseJson(text) {
  const data = JSON.parse(text)
  // Yoast option: array of { origin, url, type, format } — or object keyed by origin.
  const arr = Array.isArray(data) ? data : Object.values(data)
  return arr.map((r) => ({
    from: r.origin ?? r.from ?? r.source ?? r.old ?? '',
    to: r.url ?? r.to ?? r.target ?? r.new ?? '',
    type: String(r.type ?? '301'),
    format: r.format, // 'plain' | 'regex' for Yoast
  }))
}

function parseText(text) {
  const out = []
  for (const line of text.split(/\r?\n/)) {
    const l = line.trim()
    if (!l || l.startsWith('#')) continue
    // Apache: Redirect 301 /old /new   |   RedirectPermanent /old /new
    let m = l.match(/^Redirect(?:Permanent)?\s+(?:301\s+)?(\S+)\s+(\S+)/i)
    if (m) { out.push({ from: m[1], to: m[2], type: '301' }); continue }
    // nginx: rewrite ^/old$ /new permanent;   |   location /old { return 301 /new; }
    m = l.match(/rewrite\s+\^?(\S+?)\$?\s+(\S+)\s+permanent/i)
    if (m) { out.push({ from: m[1], to: m[2], type: '301' }); continue }
    m = l.match(/return\s+301\s+(\S+);?/i)
    if (m) { /* needs a location; skip bare */ continue }
    // bare: 301 /old /new  |  /old /new
    m = l.match(/^(?:301\s+)?(\/\S+)\s+(\S+)$/)
    if (m) { out.push({ from: m[1], to: m[2], type: '301' }) }
  }
  return out
}

function parseFile(path) {
  const text = readFileSync(path, 'utf-8')
  if (/\.json$/i.test(path)) return parseJson(text)
  if (/\.csv$/i.test(path) || /,|;|\t/.test(text.split('\n')[0] || '')) return parseCsv(text)
  return parseText(text)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv()
  const client = makeSanity(env)

  if (undo) {
    const ids = await client.fetch(`*[_type == "pageRedirect" && _id match "${ID_PREFIX}*"]._id`)
    console.log(`\n🗑  Deleting ${ids.length} redirect docs imported by this script…`)
    if (!dryRun) {
      let tx = client.transaction()
      ids.forEach((id) => { tx = tx.delete(id) })
      if (ids.length) await tx.commit()
    }
    console.log(dryRun ? '   (dry-run — nothing deleted)\n' : '   done.\n')
    return
  }

  if (!file) {
    console.error('Usage: node import-redirects.mjs <redirects.csv|.json|.txt> [--dry-run] [--limit=N]')
    console.error('       node import-redirects.mjs --undo')
    process.exit(1)
  }

  const raw = parseFile(file)

  // Normalise + filter to plain 301s.
  const seen = new Set()
  const skippedRegex = []
  const rows = []
  for (const r of raw) {
    if (r.format === 'regex') { skippedRegex.push(r.from); continue }
    const type = String(r.type || '301').replace(/\D/g, '') || '301'
    if (type !== '301') continue
    const from = normFrom(r.from)
    const to = normTo(r.to)
    if (!from || !to || from === to) continue
    if (seen.has(from)) continue
    seen.add(from)
    rows.push({ from, to })
  }

  // Skip any `from` that already has a redirect in Sanity (protect manual ones).
  const existing = new Set(
    await client.fetch(`*[_type == "pageRedirect"].from`)
  )
  const toCreate = rows.filter((r) => !existing.has(r.from))
  const limited = LIMIT ? toCreate.slice(0, LIMIT) : toCreate

  console.log(`\n📥 Parsed ${raw.length} rows → ${rows.length} valid 301s`)
  if (skippedRegex.length) console.log(`   ⚠️  skipped ${skippedRegex.length} regex redirects (need middleware logic)`)
  console.log(`   ${existing.size} redirects already in Sanity · ${toCreate.length} new · importing ${limited.length}`)
  console.log(dryRun ? '   MODE: dry-run (no writes)\n' : '   MODE: LIVE\n')

  for (const r of limited.slice(0, 40)) console.log(`  • ${r.from}  →  ${r.to}`)
  if (limited.length > 40) console.log(`  … and ${limited.length - 40} more`)

  if (dryRun || limited.length === 0) {
    console.log(dryRun ? '\nDRY RUN — nothing written.\n' : '\nNothing new to import.\n')
    return
  }

  let tx = client.transaction()
  for (const r of limited) {
    tx = tx.createOrReplace({
      _id: idFor(r.from),
      _type: 'pageRedirect',
      from: r.from,
      to: r.to,
      active: true,
      note: 'Imported from Yoast (WordPress)',
    })
  }
  await tx.commit()

  console.log(`\n✅ Created ${limited.length} redirect${limited.length === 1 ? '' : 's'}.`)
  console.log(`   Undo anytime:  node import-redirects.mjs --undo\n`)
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
