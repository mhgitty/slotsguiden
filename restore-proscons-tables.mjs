/**
 * Restore document bodies from a backup written by convert-proscons-tables.mjs.
 *
 * If the Pros & Cons conversion breaks anything, this puts the EXACT original
 * `body` back on every document that was changed — a full, precise undo.
 *
 * Usage (from project root, needs .env.local with SANITY_WRITE_TOKEN):
 *   node restore-proscons-tables.mjs proscons-backup-<timestamp>.json --dry-run
 *   node restore-proscons-tables.mjs proscons-backup-<timestamp>.json
 *
 * The backup file is a JSON array of { _id, _type, body } captured before the
 * conversion wrote anything.
 */
import { readFileSync } from 'node:fs'
import { loadEnv, makeSanity } from './migrate-lib.mjs'

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const file = argv.find((a) => !a.startsWith('--'))

if (!file) {
  console.error('Usage: node restore-proscons-tables.mjs <backup-file.json> [--dry-run]')
  process.exit(1)
}

async function main() {
  const env = loadEnv()
  const client = makeSanity(env)

  let entries
  try {
    entries = JSON.parse(readFileSync(file, 'utf-8'))
  } catch (e) {
    console.error(`❌ Could not read/parse backup file "${file}": ${e.message}`)
    process.exit(1)
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    console.error('❌ Backup file is empty or not a JSON array.')
    process.exit(1)
  }

  console.log(`\n♻️  Restoring ${entries.length} document bodies from ${file}`)
  console.log(dryRun ? '   MODE: dry-run (no writes)\n' : '   MODE: LIVE — will restore originals\n')

  let done = 0
  for (const e of entries) {
    if (!e?._id || !Array.isArray(e.body)) {
      console.log(`  ⚠️  skipping malformed entry: ${JSON.stringify(e?._id ?? e)}`)
      continue
    }
    console.log(`  • ${e._type || '?'}  ${e._id}`)
    if (!dryRun) {
      await client.patch(e._id).set({ body: e.body }).commit({ autoGenerateArrayKeys: true })
      done++
    }
  }

  console.log('\n──────────────────────────────────────────')
  if (dryRun) {
    console.log(`DRY RUN — would restore ${entries.length} documents. Nothing was written.`)
  } else {
    console.log(`✅ Restored ${done} document${done === 1 ? '' : 's'} to their original bodies.`)
  }
  console.log('──────────────────────────────────────────\n')
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
