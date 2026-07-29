// One-time cleanup: convert all "weak" references (created during migration)
// into strong references, clearing the "Reference strength mismatch" warnings
// in Sanity Studio.
//
//   node convert-weak-refs.mjs         # apply
//   node convert-weak-refs.mjs --dry   # just report, change nothing
//
// It sends small `unset` patches (only the `_weak` flag on each reference),
// so it never hits Sanity's 4 MB request limit no matter how large the
// documents are. A reference is only upgraded if its target document exists;
// references to a missing document are left weak (a strong ref to a
// nonexistent doc is invalid), so this is always safe and re-runnable.

import { loadEnv, makeSanity } from './migrate-lib.mjs'

const DRY = process.argv.includes('--dry')

/**
 * Walk a document and collect the patch paths of every `_weak` flag that can
 * be removed (target exists). Also counts references left weak (missing target).
 */
function collectUnsetPaths(node, exists, basePath, out, stats) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      const seg = item && typeof item === 'object' && item._key != null
        ? `[_key=="${item._key}"]`
        : `[${i}]`
      collectUnsetPaths(item, exists, basePath + seg, out, stats)
    })
    return
  }
  if (node && typeof node === 'object') {
    if (node._type === 'reference' && node._weak === true && node._ref) {
      if (exists.has(node._ref)) out.push(basePath + '._weak')
      else stats.dangling++
    }
    for (const k of Object.keys(node)) {
      if (k.startsWith('_')) continue // don't descend into _ref/_type/etc.
      const childPath = basePath ? `${basePath}.${k}` : k
      collectUnsetPaths(node[k], exists, childPath, out, stats)
    }
  }
}

async function run() {
  const env = loadEnv()
  const sanity = makeSanity(env)

  console.log('Fetching all documents…')
  const all = await sanity.fetch('*')
  const published = new Set(all.filter((d) => !d._id.startsWith('drafts.')).map((d) => d._id))
  console.log(`  ${all.length} documents, ${published.size} published.`)

  const stats = { dangling: 0 }
  const jobs = [] // { id, paths }
  for (const doc of all) {
    const paths = []
    collectUnsetPaths(doc, published, '', paths, stats)
    if (paths.length) jobs.push({ id: doc._id, paths })
  }

  const totalPaths = jobs.reduce((n, j) => n + j.paths.length, 0)
  console.log(`\n${jobs.length} document(s) with ${totalPaths} weak reference(s) that can be made strong.`)
  if (stats.dangling > 0) {
    console.log(`${stats.dangling} reference(s) point at a missing document and will stay weak (expected).`)
  }

  if (DRY) { console.log('\n--dry: no changes written.'); return }
  if (jobs.length === 0) { console.log('Nothing to do — all references are already strong. 🎉'); return }

  const BATCH = 100
  let done = 0
  for (let i = 0; i < jobs.length; i += BATCH) {
    let tx = sanity.transaction()
    for (const job of jobs.slice(i, i + BATCH)) {
      tx = tx.patch(job.id, { unset: job.paths })
    }
    await tx.commit({ visibility: 'async' })
    done += Math.min(BATCH, jobs.length - i)
    console.log(`  committed ${done}/${jobs.length}`)
  }
  console.log('\nDone — all references converted to strong. ✅')
}

run().catch((e) => { console.error(e); process.exit(1) })
