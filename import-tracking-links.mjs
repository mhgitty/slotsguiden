/**
 * Import affiliate tracking-link redirects into Sanity as `redirect` documents.
 *
 * These power the /go/[code] route: /go/<code> → 302 → destination URL.
 *
 * Input: a text file with one "name,url" per line, e.g.
 *     leovegas,https://bandstrack.com/r/leovegas?site=slotsguiden.dk
 * The name (before the first comma) becomes BOTH the Navn (title) and the
 * Kode (code, used in the URL). The rest of the line is the Destination URL.
 *
 * By default existing codes are skipped (never overwritten). Pass --overwrite
 * to update the destination of codes that already exist.
 *
 * Usage (from project root, needs .env.local with SANITY_WRITE_TOKEN):
 *   node import-tracking-links.mjs redirects.txt --dry-run     # preview  ← run first
 *   node import-tracking-links.mjs redirects.txt               # create new ones
 *   node import-tracking-links.mjs redirects.txt --overwrite   # also update existing codes
 *   node import-tracking-links.mjs --undo                       # delete what this script imported
 */
import { readFileSync } from 'node:fs'
import { loadEnv, makeSanity } from './migrate-lib.mjs'

const ID_PREFIX = 'go-redirect-'

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const overwrite = argv.includes('--overwrite')
const undo = argv.includes('--undo')
const limitArg = argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) || 0 : 0
const file = argv.find((a) => !a.startsWith('--'))

const idFor = (code) => ID_PREFIX + code

function parse(text) {
  const out = []
  for (const line of text.split(/\r?\n/)) {
    const l = line.trim()
    if (!l || l.startsWith('#')) continue
    const idx = l.indexOf(',')
    if (idx === -1) continue
    const name = l.slice(0, idx).trim()
    const url = l.slice(idx + 1).trim()
    if (!name || !/^https?:\/\//i.test(url)) continue
    out.push({ code: name, title: name, destination: url })
  }
  return out
}

async function main() {
  const env = loadEnv()
  const client = makeSanity(env)

  if (undo) {
    const ids = await client.fetch(`*[_type == "redirect" && _id match "${ID_PREFIX}*"]._id`)
    console.log(`\n🗑  Deleting ${ids.length} tracking redirects imported by this script…`)
    if (!dryRun && ids.length) {
      let tx = client.transaction()
      ids.forEach((id) => { tx = tx.delete(id) })
      await tx.commit()
    }
    console.log(dryRun ? '   (dry-run — nothing deleted)\n' : '   done.\n')
    return
  }

  if (!file) {
    console.error('Usage: node import-tracking-links.mjs <redirects.txt> [--dry-run] [--overwrite] [--limit=N]')
    console.error('       node import-tracking-links.mjs --undo')
    process.exit(1)
  }

  const rows = parse(readFileSync(file, 'utf-8'))

  // De-dupe by code (last wins).
  const byCode = new Map()
  for (const r of rows) byCode.set(r.code, r)
  const all = Array.from(byCode.values())

  const existing = new Set(await client.fetch(`*[_type == "redirect"].code.current`))
  const toWrite = overwrite ? all : all.filter((r) => !existing.has(r.code))
  const limited = LIMIT ? toWrite.slice(0, LIMIT) : toWrite

  console.log(`\n📥 Parsed ${rows.length} lines → ${all.length} unique codes`)
  console.log(`   ${existing.size} already in Sanity · writing ${limited.length}${overwrite ? ' (overwrite on)' : ' (new only)'}`)
  console.log(dryRun ? '   MODE: dry-run (no writes)\n' : '   MODE: LIVE\n')

  for (const r of limited.slice(0, 60)) console.log(`  • /go/${r.code}  →  ${r.destination}`)
  if (limited.length > 60) console.log(`  … and ${limited.length - 60} more`)

  if (dryRun || limited.length === 0) {
    console.log(dryRun ? '\nDRY RUN — nothing written.\n' : '\nNothing new to import.\n')
    return
  }

  let tx = client.transaction()
  for (const r of limited) {
    tx = tx.createOrReplace({
      _id: idFor(r.code),
      _type: 'redirect',
      market: 'global',
      title: r.title,
      code: { _type: 'slug', current: r.code },
      destination: r.destination,
      active: true,
      notes: 'Imported from tracking-links list',
    })
  }
  await tx.commit()

  console.log(`\n✅ Wrote ${limited.length} tracking redirect${limited.length === 1 ? '' : 's'}.`)
  console.log(`   Undo:  node import-tracking-links.mjs --undo\n`)
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
