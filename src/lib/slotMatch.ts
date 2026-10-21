// Find the slot a campaign is about ("20 Free Spins til Sweet Bonanza 1000"),
// so campaign cards can show the game and link to its page.
import { client, SLOT_CARD } from '@/lib/sanity'
import { slotName } from '@/components/slot/slotUtils'

export interface MatchedSlot { name: string; slug: string; img?: string | null; hasDemo?: boolean }

const norm = (s: string) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[™®]/g, '').replace(/[^a-z0-9æøå]+/g, ' ').trim()} `

let cache: { at: number; list: (MatchedSlot & { key: string })[] } | null = null

async function slotIndex() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.list
  const rows: any[] = await client.fetch(
    `*[_type == "slotmachine" && defined(slug.current) && !(_id in path("drafts.**"))]{ name, "slug": slug.current, ${SLOT_CARD} }`
  ).catch(() => [])
  const list = rows
    .map((r) => ({ name: slotName(r.name), slug: r.slug, img: r.img, hasDemo: r.hasDemo, key: norm(slotName(r.name)) }))
    .filter((r) => r.key.trim().length >= 4)
    .sort((a, b) => b.key.length - a.key.length) // longest name first: "Sweet Bonanza 1000" before "Sweet Bonanza"
  cache = { at: Date.now(), list }
  return list
}

/** Returns a matcher; call it with an offer title. */
export async function slotMatcher() {
  const list = await slotIndex()
  return (title?: string | null): MatchedSlot | null => {
    if (!title) return null
    const t = norm(title)
    const hit = list.find((s) => t.includes(s.key))
    return hit ? { name: hit.name, slug: hit.slug, img: hit.img, hasDemo: hit.hasDemo } : null
  }
}
