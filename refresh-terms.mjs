/**
 * Re-pull the HTML `terms` from WordPress for casinos (bookmaker) and bonuses.
 *
 * On the original import the terms field was run through a plain-text cleaner,
 * which stripped the <a> links that point to each operator's own T&C. The Sanity
 * `terms` field is a plain string and happily stores HTML — so this script pulls
 * the ORIGINAL html straight from the WP REST API and writes it back, untouched.
 * It only touches the `terms` field; every other field you've edited is left alone.
 *
 * WP source fields:
 *   casinoer        acf.terms                 → Sanity bookmaker (wp-bookmaker-<id>)
 *   casino-bonusser acf.terms_and_conditions  → Sanity bonus     (wp-bonus-<id>)
 *
 * Usage (from project root, needs .env.local with SANITY_WRITE_TOKEN):
 *   node refresh-terms.mjs --dry-run          # preview only, writes NOTHING  ← run first
 *   node refresh-terms.mjs                    # apply (writes a backup first)
 *   node refresh-terms.mjs --type=bonus       # only bonuses (or --type=bookmaker)
 *   node refresh-terms.mjs --limit=5          # first 5 changed docs (safe test)
 *   node refresh-terms.mjs --only-with-links  # only update terms that contain an <a> link
 *
 * REVERT: a backup of the original terms is written to terms-backup-<timestamp>.json
 *   before any write. Restore with:
 *     node restore-terms.mjs terms-backup-<timestamp>.json
 */
import { writeFileSync } from 'node:fs'
import { loadEnv, makeSanity, fetchAllCPT } from './migrate-lib.mjs'

const WP_BASE = 'https://slotsguiden.dk'

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const onlyWithLinks = argv.includes('--only-with-links')
const limitArg = argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) || 0 : 0
const typeArg = argv.find((a) => a.startsWith('--type='))
const ONLY_TYPE = typeArg ? typeArg.split('=')[1] : null

const SOURCES = [
  { key: 'bookmaker', restBase: 'casinoer',        idPrefix: 'wp-bookmaker', field: 'terms' },
  { key: 'bonus',     restBase: 'casino-bonusser', idPrefix: 'wp-bonus',     field: 'terms_and_conditions' },
]

const hasLink = (s) => /<a\b/i.test(s || '')

async function main() {
  const env = loadEnv()
  const client = makeSanity(env)

  console.log(`\n🔎 Re-pulling terms HTML from ${WP_BASE}${ONLY_TYPE ? ` (type: ${ONLY_TYPE})` : ''}…`)
  console.log(dryRun ? '   MODE: dry-run (no writes)\n' : '   MODE: LIVE — will write changes\n')

  const changes = [] // { id, type, oldTerms, newTerms, hasLink }
  const stats = {}

  for (const src of SOURCES) {
    if (ONLY_TYPE && ONLY_TYPE !== src.key) continue
    stats[src.key] = { fromWp: 0, withTerms: 0, withLink: 0, changed: 0 }

    const wpItems = await fetchAllCPT(WP_BASE, src.restBase, 0)
    stats[src.key].fromWp = wpItems.length

    // Current Sanity terms for these docs, for diffing + backup.
    const ids = wpItems.map((w) => `${src.idPrefix}-${w.id}`)
    const current = await client.fetch(`*[_id in $ids]{ _id, terms }`, { ids })
    const currentMap = new Map(current.map((d) => [d._id, d.terms ?? '']))

    for (const w of wpItems) {
      const acf = w.acf || {}
      const raw = String(acf[src.field] ?? '').trim()
      if (!raw) continue
      stats[src.key].withTerms++
      if (hasLink(raw)) stats[src.key].withLink++
      if (onlyWithLinks && !hasLink(raw)) continue

      const id = `${src.idPrefix}-${w.id}`
      if (!currentMap.has(id)) continue // doc doesn't exist in Sanity
      const oldTerms = currentMap.get(id)
      if (oldTerms === raw) continue // already identical

      changes.push({ id, type: src.key, oldTerms, newTerms: raw, hasLink: hasLink(raw) })
      stats[src.key].changed++
    }
  }

  // Apply limit across the combined change set.
  const limited = LIMIT ? changes.slice(0, LIMIT) : changes

  for (const c of limited) {
    console.log(`  • ${c.type}  ${c.id}${c.hasLink ? '  🔗' : ''}`)
  }

  console.log('\n──────────────────────────────────────────')
  for (const [k, s] of Object.entries(stats)) {
    console.log(`${k}: ${s.fromWp} in WP · ${s.withTerms} have terms · ${s.withLink} contain a link · ${s.changed} differ from Sanity`)
  }
  console.log(`Will update: ${limited.length} document${limited.length === 1 ? '' : 's'}`)

  if (dryRun) {
    console.log('\nDRY RUN — nothing written. Re-run without --dry-run to apply.')
    console.log('──────────────────────────────────────────\n')
    return
  }
  if (limited.length === 0) {
    console.log('\nNothing to update.')
    console.log('──────────────────────────────────────────\n')
    return
  }

  // Backup originals BEFORE writing.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `terms-backup-${stamp}.json`
  writeFileSync(
    backupFile,
    JSON.stringify(limited.map((c) => ({ _id: c.id, _type: c.type, terms: c.oldTerms })), null, 2),
    'utf-8'
  )
  console.log(`\n💾 Backup of ${limited.length} original terms → ${backupFile}`)
  console.log(`   To undo:  node restore-terms.mjs ${backupFile}\n`)

  let done = 0
  for (const c of limited) {
    await client.patch(c.id).set({ terms: c.newTerms }).commit()
    done++
  }

  console.log(`✅ Updated terms on ${done} document${done === 1 ? '' : 's'}.`)
  console.log('──────────────────────────────────────────\n')
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
