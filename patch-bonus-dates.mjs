/**
 * Backfill `publishedAt` on already-migrated bonus documents from their
 * WordPress date — WITHOUT re-uploading any images. Fast, safe, idempotent.
 *
 * Run from the project root (needs .env.local with SANITY_WRITE_TOKEN):
 *   node patch-bonus-dates.mjs
 */
import { loadEnv, makeSanity, fetchAllCPT } from './migrate-lib.mjs'

const WP_BASE = 'https://slotsguiden.dk'
const sanity = makeSanity(loadEnv())

const posts = await fetchAllCPT(WP_BASE, 'casino-bonusser', 0)
console.log(`Fetched ${posts.length} WordPress bonuses`)

// Only patch docs that actually exist in Sanity
const existing = new Set(await sanity.fetch(`*[_type == "bonus"]._id`))

let tx = sanity.transaction()
let n = 0, batch = 0
for (const wp of posts) {
  const id = `wp-bonus-${wp.id}`
  if (!wp.date_gmt || !existing.has(id)) continue
  tx = tx.patch(id, (p) => p.set({ publishedAt: new Date(wp.date_gmt + 'Z').toISOString() }))
  n++; batch++
  if (batch >= 100) { await tx.commit(); tx = sanity.transaction(); batch = 0; process.stdout.write(`  …${n}\n`) }
}
if (batch > 0) await tx.commit()
console.log(`✅ Patched publishedAt on ${n} bonuses`)
