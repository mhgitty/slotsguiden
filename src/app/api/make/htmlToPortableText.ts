import { parse, HTMLElement, Node, NodeType } from 'node-html-parser'

// Converts the AI-generated HTML body into proper Sanity Portable Text blocks
// so headings, paragraphs, lists, quotes, tables and the FAQ each become the
// right block type — instead of one raw HTML dump. Anything it can't map
// cleanly (e.g. a <table>) is preserved verbatim inside an htmlBlock.

type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type MarkDef = { _key: string; _type: 'link'; href: string; blank?: boolean; nofollow?: boolean }
type Block = Record<string, unknown>

let counter = 0
const key = () => `k${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

// Rewrite any preview/Vercel host to the canonical domain — belt-and-suspenders
// even after the AI prompts are fixed.
export function canonicalizeUrl(url: string): string {
  return (url || '')
    .replace(/https?:\/\/(?:[a-z0-9-]+\.)*vercel\.app/gi, 'https://slotsguiden.dk')
}

const HEADING_STYLE: Record<string, string> = { h1: 'h2', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h4', h6: 'h4' }

// ── Inline: turn a node's children into spans + link markDefs ─────────────────
function inlineSpans(node: Node, activeMarks: string[], markDefs: MarkDef[]): Span[] {
  const out: Span[] = []
  for (const child of node.childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) {
      const text = (child as any).rawText ? decode((child as any).rawText) : child.text
      if (text) out.push({ _type: 'span', _key: key(), text, marks: [...activeMarks] })
      continue
    }
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue
    const el = child as HTMLElement
    const tag = el.rawTagName?.toLowerCase()
    if (tag === 'br') { out.push({ _type: 'span', _key: key(), text: '\n', marks: [...activeMarks] }); continue }
    if (tag === 'strong' || tag === 'b') { out.push(...inlineSpans(el, [...activeMarks, 'strong'], markDefs)); continue }
    if (tag === 'em' || tag === 'i') { out.push(...inlineSpans(el, [...activeMarks, 'em'], markDefs)); continue }
    if (tag === 'a') {
      const href = canonicalizeUrl(el.getAttribute('href') || '')
      if (href) {
        const external = /^https?:\/\//i.test(href) && !/slotsguiden\.dk/i.test(href)
        const def: MarkDef = { _key: key(), _type: 'link', href, blank: external, nofollow: external }
        markDefs.push(def)
        out.push(...inlineSpans(el, [...activeMarks, def._key], markDefs))
      } else {
        out.push(...inlineSpans(el, activeMarks, markDefs))
      }
      continue
    }
    // any other inline wrapper (span, u, small…) — keep the text, drop the tag
    out.push(...inlineSpans(el, activeMarks, markDefs))
  }
  return out
}

function textBlock(el: HTMLElement, style: string): Block {
  const markDefs: MarkDef[] = []
  let children = inlineSpans(el, [], markDefs)
  if (children.length === 0) children = [{ _type: 'span', _key: key(), text: el.text.trim(), marks: [] }]
  return { _type: 'block', _key: key(), style, markDefs, children }
}

function listBlocks(listEl: HTMLElement, kind: 'bullet' | 'number'): Block[] {
  const items: Block[] = []
  for (const li of listEl.childNodes) {
    if (li.nodeType !== NodeType.ELEMENT_NODE) continue
    if ((li as HTMLElement).rawTagName?.toLowerCase() !== 'li') continue
    const markDefs: MarkDef[] = []
    let children = inlineSpans(li as HTMLElement, [], markDefs)
    if (children.length === 0) children = [{ _type: 'span', _key: key(), text: (li as HTMLElement).text.trim(), marks: [] }]
    items.push({ _type: 'block', _key: key(), style: 'normal', listItem: kind, level: 1, markDefs, children })
  }
  return items
}

function htmlBlock(html: string): Block {
  return { _type: 'htmlBlock', _key: key(), html: canonicalizeUrl(html) }
}

// crude HTML entity decode for the few entities the AI emits
function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}

const isHeading = (t?: string) => !!t && /^h[1-6]$/.test(t)
const isFaqHeading = (text: string) => /faq|ofte stillede|spørgsm/i.test(text)

export function htmlToPortableText(rawHtml: string): Block[] {
  const html = canonicalizeUrl(rawHtml || '')
  const root = parse(html, { blockTextElements: { script: false, style: false } })
  const nodes = root.childNodes.filter(
    (n) => n.nodeType === NodeType.ELEMENT_NODE || (n.nodeType === NodeType.TEXT_NODE && n.text.trim())
  )

  const blocks: Block[] = []
  let faqItems: { question: string; answer: string }[] | null = null
  let pendingQuestion: string | null = null

  const flushFaq = () => {
    if (faqItems && faqItems.length) {
      blocks.push({
        _type: 'faqBlock',
        _key: key(),
        items: faqItems.map((it) => ({ _type: 'faqItem', _key: key(), question: it.question, answer: it.answer })),
      })
    }
    faqItems = null
    pendingQuestion = null
  }

  for (const node of nodes) {
    // stray top-level text → paragraph
    if (node.nodeType === NodeType.TEXT_NODE) {
      const t = node.text.trim()
      if (t) blocks.push({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text: t, marks: [] }] })
      continue
    }
    const el = node as HTMLElement
    const tag = el.rawTagName?.toLowerCase() || ''

    // ── FAQ mode: collect h3 question / answer pairs ──
    if (faqItems) {
      if (tag === 'h3' || tag === 'h4') { pendingQuestion = el.text.trim(); continue }
      if (isHeading(tag)) { flushFaq() /* a new section ends the FAQ */ }
      else {
        if (pendingQuestion) {
          faqItems.push({ question: pendingQuestion, answer: el.text.trim() })
          pendingQuestion = null
          continue
        }
        // pre-question intro paragraph inside FAQ → keep as normal text
        blocks.push(textBlock(el, 'normal'))
        continue
      }
    }

    if (isHeading(tag)) {
      if (tag === 'h2' && isFaqHeading(el.text)) {
        blocks.push(textBlock(el, 'h2')) // keep the FAQ heading visible
        faqItems = []                     // enter FAQ mode
        continue
      }
      blocks.push(textBlock(el, HEADING_STYLE[tag]))
    } else if (tag === 'p') {
      const t = el.text.trim()
      if (t) blocks.push(textBlock(el, 'normal'))
    } else if (tag === 'ul') {
      blocks.push(...listBlocks(el, 'bullet'))
    } else if (tag === 'ol') {
      blocks.push(...listBlocks(el, 'number'))
    } else if (tag === 'blockquote') {
      blocks.push(textBlock(el, 'blockquote'))
    } else if (tag === 'table' || tag === 'figure') {
      blocks.push(htmlBlock(el.toString()))
    } else if (tag === 'div' || tag === 'section' || tag === 'article') {
      // unwrap simple containers, recurse into their children
      blocks.push(...htmlToPortableText(el.innerHTML))
    } else {
      const t = el.text.trim()
      if (t) blocks.push({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text: t, marks: [] }] })
    }
  }

  flushFaq()
  return blocks
}
