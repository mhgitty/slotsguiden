// Cut a Portable Text value (or plain string) after N words, keeping links and
// bold/italic marks. Returns null when it is already short enough.

const words = (s: string) => s.split(/\s+/).filter(Boolean).length

export function truncatePT(value: any, max = 50): any | null {
  if (!value) return null
  if (typeof value === 'string') {
    const parts = value.trim().split(/\s+/)
    return parts.length > max ? parts.slice(0, max).join(' ') + '…' : null
  }
  if (!Array.isArray(value)) return null
  const total = value.reduce((n, b) => n + (b?._type === 'block' ? words((b.children || []).map((c: any) => c.text || '').join('')) : 0), 0)
  if (total <= max) return null

  let left = max
  const out: any[] = []
  for (const b of value) {
    if (left <= 0) break
    if (b?._type !== 'block') continue // images and other blocks are left out of the short version
    const children: any[] = []
    for (const c of b.children || []) {
      if (left <= 0) break
      const text: string = c.text || ''
      const n = words(text)
      if (n <= left) { children.push(c); left -= n; continue }
      // cut inside this span, keeping its leading space
      const lead = text.match(/^\s*/)?.[0] || ''
      children.push({ ...c, text: lead + text.trim().split(/\s+/).slice(0, left).join(' ') })
      left = 0
    }
    out.push({ ...b, children })
  }
  const last = out[out.length - 1]
  const lastChild = last?.children?.[last.children.length - 1]
  if (lastChild) lastChild.text = lastChild.text.replace(/[\s,.;:–-]*$/, '') + '…'
  return out
}
