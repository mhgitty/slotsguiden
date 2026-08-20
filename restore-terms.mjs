/**
 * Restore the `terms` field from a backup written by refresh-terms.mjs.
 *
 * Usage (from project root, needs .env.local with SANITY_WRITE_TOKEN):
 *   node restore-terms.mjs terms-backup-<timestamp>.json --dry-run
 *   node restore-terms.mjs terms-backup-<timestamp>.json
 */
import { readFileSync } from 'node:fs'
import { loadEnv, makeSanity } from './migrate-lib.mjs'

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const file = argv.find((a) => !a.startsWith('--'))

if (!file) {
  console.error('Usage: node restore-terms.mjs <backup-file.json> [--dry-run]')
  process.exit(1)
}

async function main() {
  const env = loadEnv()
  const client = makeSanity(env)

  let entries
  try {
    entries = JSON.parse(readFileSync(file, 'utf-8'))
  } catch (e) {
    console.error(`❌ Could not read/parse "${file}": ${e.message}`)
    process.exit(1)
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    console.error('❌ Backup file is empty or not a JSON array.')
    process.exit(1)
  }

  console.log(`\n♻️  Restoring terms on ${entries.length} documents from ${file}`)
  console.log(dryRun ? '   MODE: dry-run (no writes)\n' : '   MODE: LIVE\n')

  let done = 0
  for (const e of entries) {
    if (!e?._id) { console.log(`  ⚠️  skipping malformed entry`); continue }
    console.log(`  • ${e._type || '?'}  ${e._id}`)
    if (!dryRun) {
      // Restore the exact original value (may be empty string → unset to empty).
      await client.patch(e._id).set({ terms: e.terms ?? '' }).commit()
      done++
    }
  }

  console.log('\n──────────────────────────────────────────')
  console.log(dryRun ? `DRY RUN — would restore ${entries.length}.` : `✅ Restored terms on ${done} document${done === 1 ? '' : 's'}.`)
  console.log('──────────────────────────────────────────\n')
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
