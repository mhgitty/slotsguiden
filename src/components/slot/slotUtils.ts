// Shared helpers for the slot (spillemaskine) pages.

export interface SlotCasino {
  _id: string
  name: string
  slug?: string
  score?: number
  url?: string
  indbetalingsbonus?: string
  freeSpinsBonus?: string
  minIndbetaling?: number | string
  gennemspilskrav?: string
  terms?: any
  logoUrl?: string
}

/** "Gates of Olympus Anmeldelse – Gratis Demo" → "Gates of Olympus" */
export function slotName(name: string = ''): string {
  return name
    .replace(/\s+(anmeldelse|review)\b.*$/i, '')
    .replace(/\s*gratis spillemaskine demo\b.*$/i, '')
    .replace(/\s*[–—-]?\s*gratis demo\b.*$/i, '')
    .trim() || name
}

/**
 * Casinos for the "Spil for rigtige penge" picker: the slot's own list, else
 * the standard list from Site settings, else the provider's best-rated casinos.
 * Casinos without an affiliate link are skipped.
 */
export function pickCasinos(g: any, max = 6): SlotCasino[] {
  const ok = (l?: SlotCasino[] | null) => (l || []).filter((c) => c && c.url)
  const own = ok(g?.ownCasinos)
  const std = ok(g?.defaultCasinos)
  const list = own.length ? own
    : std.length ? std
    : ok(g?.providerCasinos).sort((a, b) => (b.score || 0) - (a.score || 0))
  // "Fremhævet casino" goes first (pre-selected), without duplicates
  const hl = g?.highlight?.url ? [g.highlight as SlotCasino] : []
  return [...hl, ...list.filter((c) => c._id !== hl[0]?._id)].slice(0, max)
}

/** Demo link: the Demo URL field, else the src taken from pasted embed code. */
export function demoSrc(g: any): string | null {
  const raw = String(g?.demoIframe || '').trim()
  if (!raw) return null
  const m = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  const url = (m ? m[1] : raw).replace(/&#0?38;|&amp;/g, '&').trim()
  return /^https:\/\//.test(url) ? url : null
}

/** Volatility is stored in English (shared schema); shown in Danish. */
const VOL_DA: Record<string, string> = { 'Low': 'Lav', 'Medium-Low': 'Lav-middel', 'Medium': 'Middel', 'Medium-High': 'Middel-høj', 'High': 'Høj', 'Very High': 'Meget høj' }
export function volDa(v?: string | null): string | null {
  if (!v) return null
  return VOL_DA[v.trim()] || v
}
export const VOL_LEVEL: Record<string, number> = { 'Low': 1, 'Medium-Low': 1, 'Medium': 2, 'Medium-High': 2, 'High': 3, 'Very High': 3 }

/** Bonus features as a list; older entries stored them as one comma-separated text. */
export function featureList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === 'string') return v.split(/\s*[,;]\s*/).map((x) => x.trim()).filter(Boolean)
  return []
}

/** The offer line for a casino: deposit bonus, else free spins. */
export function offerOf(c: SlotCasino): string {
  const clean = (s?: string) => (s && s.trim() !== '-' ? s.trim() : '')
  return clean(c.indbetalingsbonus) || clean(c.freeSpinsBonus) || 'Se casinoets aktuelle velkomsttilbud'
}

export function minDeposit(c: SlotCasino): string | null {
  const v = c.minIndbetaling
  if (v == null || v === '') return null
  return typeof v === 'number' ? `${v.toLocaleString('da-DK')} kr.` : String(v)
}
