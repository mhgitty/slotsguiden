/**
 * Bulk-convert "Fordele / Ulemper" tableBlocks into prosConsBlock objects.
 *
 * When the WordPress pages were imported, most Pros & Cons sections landed as
 * 2-column tables (headers "Fordele" / "Ulemper") instead of the dedicated
 * Pros & Cons block. This script finds those tables inside every document's
 * `body` and swaps each one in-place for a prosConsBlock — keeping its position
 * (same _key) and title. All other tables (comparison tables, stat tables, …)
 * are left untouched.
 *
 * Runs against the live dataset — no re-import needed.
 *
 * Usage (from project root, needs .env.local with SANITY_WRITE_TOKEN):
 *   node convert-proscons-tables.mjs --dry-run     # preview only, writes NOTHING  ← run this first
 *   node convert-proscons-tables.mjs               # apply the conversion
 *   node convert-proscons-tables.mjs --limit=5     # only the first 5 changed docs (safe test)
 *   node convert-proscons-tables.mjs --type=page   # restrict to one document type
 *
 * Dependencies: npm install @sanity/client   (already present)
 * Idempotent: once a table is converted it's no longer a tableBlock, so
 * re-running finds nothing more to do.
 *
 * SAFETY / REVERT:
 *   Before writing anything, this script saves the ORIGINAL body of every
 *   document it's about to change to a backup file:
 *       proscons-backup-<timestamp>.json
 *   If the conversion breaks anything, restore the exact originals with:
 *       node restore-proscons-tables.mjs proscons-backup-<timestamp>.json
 *   (Sanity also keeps per-document history in Studio as a secondary net.)
 */
import { writeFileSync } from 'node:fs'
import { loadEnv, makeSanity } from './migrate-lib.mjs'

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const limitArg = argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) || 0 : 0
const typeArg = argv.find((a) => a.startsWith('--type='))
const ONLY_TYPE = typeArg ? typeArg.split('=')[1] : null

// ── Detection ────────────────────────────────────────────────────────────────
// Normalise a header cell: trim, drop emoji/symbols, lowercase.
function norm(s) {
  return String(s || '')
    .replace(/[^\p{L}\s]/gu, '') // keep letters + spaces only
    .trim()
    .toLowerCase()
}

const PRO_HEADERS = ['fordele', 'fordel', 'pros', 'plusser']
const CON_HEADERS = ['ulemper', 'ulempe', 'cons', 'minusser']

function isProsConsTable(block) {
  if (!block || block._type !== 'tableBlock') return false
  const h = block.headers
  if (!Array.isArray(h) || h.length !== 2) return false
  const h0 = norm(h[0])
  const h1 = norm(h[1])
  return PRO_HEADERS.includes(h0) && CON_HEADERS.includes(h1)
}

// Convert a matched tableBlock into a prosConsBlock (preserving _key + title).
function tableToProsCons(block) {
  const rows = Array.isArray(block.rows) ? block.rows : []
  const pros = rows.map((r) => (r?.cells?.[0] ?? '').trim()).filter(Boolean)
  const cons = rows.map((r) => (r?.cells?.[1] ?? '').trim()).filter(Boolean)
  const out = {
    _type: 'prosConsBlock',
    _key: block._key, // keep position + stable key
    pros,
    cons,
  }
  const title = (block.title ?? '').trim()
  if (title) out.title = title
  return out
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv()
  const client = makeSanity(env)

  console.log(`\n🔎 Scanning for "Fordele / Ulemper" tables${ONLY_TYPE ? ` (type: ${ONLY_TYPE})` : ''}…`)
  console.log(dryRun ? '   MODE: dry-run (no writes)\n' : '   MODE: LIVE — will write changes\n')

  // Fetch every document (published + drafts) that has at least one tableBlock.
  const typeFilter = ONLY_TYPE ? ` && _type == "${ONLY_TYPE}"` : ''
  const docs = await client.fetch(
    `*[count(body[_type == "tableBlock"]) > 0${typeFilter}]{ _id, _type, "title": coalesce(title, name), body }`
  )

  let convertedTables = 0
  let processed = 0
  const perType = {}

  // ── Pass 1: work out what would change (and capture originals for backup) ──
  const changes = [] // { id, type, title, isDraft, originalBody, newBody, hits }
  for (const doc of docs) {
    const body = Array.isArray(doc.body) ? doc.body : []
    let hits = 0
    const newBody = body.map((block) => {
      if (isProsConsTable(block)) {
        hits++
        return tableToProsCons(block)
      }
      return block
    })
    if (hits === 0) continue
    if (LIMIT && changes.length >= LIMIT) break

    changes.push({
      id: doc._id,
      type: doc._type,
      title: doc.title || doc._id,
      isDraft: doc._id.startsWith('drafts.'),
      originalBody: body,
      newBody,
      hits,
    })
    convertedTables += hits
    perType[doc._type] = (perType[doc._type] || 0) + hits
  }

  for (const c of changes) {
    console.log(`  • ${c.type}  ${c.isDraft ? '(draft) ' : ''}${c.title} — ${c.hits} table${c.hits > 1 ? 's' : ''}`)
  }

  console.log('\n──────────────────────────────────────────')
  console.log(`Documents with pros/cons tables : ${changes.length}`)
  console.log(`Tables converted               : ${convertedTables}`)
  console.log(`By type                        : ${JSON.stringify(perType)}`)

  if (dryRun) {
    console.log('\nDRY RUN — nothing was written. Re-run without --dry-run to apply.')
    console.log('──────────────────────────────────────────\n')
    return
  }

  if (changes.length === 0) {
    console.log('\nNothing to convert.')
    console.log('──────────────────────────────────────────\n')
    return
  }

  // ── Pass 2: write a backup of the ORIGINAL bodies, THEN patch ──
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `proscons-backup-${stamp}.json`
  const backup = changes.map((c) => ({ _id: c.id, _type: c.type, body: c.originalBody }))
  writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf-8')
  console.log(`\n💾 Backup of ${backup.length} original document bodies written to:\n   ${backupFile}`)
  console.log(`   To undo:  node restore-proscons-tables.mjs ${backupFile}\n`)

  for (const c of changes) {
    // autoGenerateArrayKeys only adds keys to items missing one; existing
    // _keys (which we preserve) are left untouched.
    await client.patch(c.id).set({ body: c.newBody }).commit({ autoGenerateArrayKeys: true })
    processed++
  }

  console.log(`✅ Wrote ${processed} document${processed === 1 ? '' : 's'}.`)
  console.log('──────────────────────────────────────────\n')
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
