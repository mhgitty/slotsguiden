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
    .replace(/\s+[–-]\s+gratis demo$/i, '')
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
  if (own.length) return own.slice(0, max)
  const std = ok(g?.defaultCasinos)
  if (std.length) return std.slice(0, max)
  return ok(g?.providerCasinos)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, max)
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
