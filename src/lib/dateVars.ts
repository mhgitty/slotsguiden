const MONTHS_DA = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Replace [year], [month], [date] tokens with current Danish date values.
 * Safe to call with null/undefined — returns the input unchanged.
 */
export function replaceDateVars(str: string | null | undefined): string {
  if (typeof str !== 'string') return ''
  if (!str) return ''
  const now = new Date()
  const year  = now.getFullYear().toString()
  const month = MONTHS_DA[now.getMonth()]
  const date  = now.getDate().toString()
  return str
    .replace(/\[year\]/gi,         year)
    .replace(/%%currentyear%%/gi,  year)
    .replace(/\[month\]/gi,        month)
    .replace(/%%currentmonth%%/gi, month)
    .replace(/\[date\]/gi,         date)
    .replace(/%%currentdate%%/gi,  date)
}

/**
 * Walk a Portable Text block array and replace date tokens in every text span.
 * Returns a new array — does not mutate the original.
 */
export function replaceDateVarsInBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks
  return blocks.map((block) => {
    if (block._type === 'block' && Array.isArray(block.children)) {
      return {
        ...block,
        children: block.children.map((child: any) =>
          child._type === 'span' && typeof child.text === 'string'
            ? { ...child, text: replaceDateVars(child.text) }
            : child
        ),
      }
    }
    return block
  })
}

/** Flatten a Portable Text array (or string) to plain text — for meta descriptions. */
export function blocksToPlainText(v: any): string {
  if (typeof v === 'string') return v
  if (!Array.isArray(v)) return ''
  return v
    .filter((b: any) => b?._type === 'block' && Array.isArray(b.children))
    .map((b: any) => b.children.filter((c: any) => c?._type === 'span').map((c: any) => c.text || '').join(''))
    .join(' ')
    .trim()
}
