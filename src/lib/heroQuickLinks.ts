/**
 * Hero "Quick links" — buttons rendered under the hero intro that smooth-scroll
 * to sections on the page.
 *
 * Anchor IDs (kept in sync with the components that own them):
 *   #sammenligning — the comparison list (ComparisonTable root)
 *   #pros-cons     — a Pros & Cons block (ProsConsBlock root)
 *   #how-to        — a How-to block (HowToBlock root)
 *   #faq           — an FAQ block (FaqBlock root)
 */

export interface QuickLink {
  label: string
  href: string
  variant: 'solid' | 'outline'
}

const DEFAULT_COMPARISON_LABEL = 'Se alle bonusser'

/** True if the Portable Text body contains at least one block of the given _type. */
function bodyHasBlock(body: any, type: string): boolean {
  return Array.isArray(body) && body.some((b: any) => b?._type === type)
}

/**
 * Build the hero quick-link buttons for a page/guide document.
 * Order: comparison (solid) first, then auto-detected body blocks (outline).
 * Max 4 buttons.
 */
export function buildHeroQuickLinks(page: any): QuickLink[] {
  if (!page) return []
  const links: QuickLink[] = []

  // 1) Comparison list button — opt-in per page.
  if (page.showComparisonTable && page.comparisonTable && page.showComparisonHeroButton) {
    links.push({
      label: (page.comparisonHeroButtonText || '').trim() || DEFAULT_COMPARISON_LABEL,
      href: '#sammenligning',
      variant: 'solid',
    })
  }

  // 2) Auto buttons from body content.
  const body = page.body
  if (bodyHasBlock(body, 'prosConsBlock')) {
    links.push({ label: 'Fordele & ulemper', href: '#pros-cons', variant: 'outline' })
  }
  if (bodyHasBlock(body, 'howToBlock')) {
    links.push({ label: 'Sådan gør du', href: '#how-to', variant: 'outline' })
  }
  if (bodyHasBlock(body, 'faqBlock')) {
    links.push({ label: 'FAQ', href: '#faq', variant: 'outline' })
  }

  return links
}
