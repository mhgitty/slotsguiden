import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { Icon } from '@/components/Icon'

// Step body is rich text (Portable Text) — supports links, bold and italic.
// (Older data may still be a plain string; both are handled below.)
type StepBody = string | any[]

interface HowToItem {
  title?: string
  body?: StepBody
}

interface HowToBlockProps {
  value: {
    title?: string
    intro?: string
    duration?: string
    items?: HowToItem[]
  }
}

const hasBody = (b?: StepBody): boolean => (Array.isArray(b) ? b.length > 0 : !!b && !!String(b).trim())

// Flatten Portable Text (or a string) to plain text — used for schema.org.
function bodyToText(b?: StepBody): string {
  if (!b) return ''
  if (typeof b === 'string') return b
  return b.map((blk: any) => (blk?.children || []).map((c: any) => c?.text || '').join('')).join(' ').trim()
}

// Inline rich-text rendering for a step body: paragraphs + link / bold / italic.
const stepBodyComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p>{children}</p>
    ),
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }: any) => {
      const rel = ['noopener', 'noreferrer', value?.nofollow ? 'nofollow' : ''].filter(Boolean).join(' ')
      return (
        <a href={value?.href} target={value?.blank ? '_blank' : '_self'} rel={rel}
          style={{ color: 'var(--green)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {children}
        </a>
      )
    },
  },
}

// Convert a human duration ("5 minutter", "2 timer") into an ISO-8601 duration
// (PT5M / PT2H) for schema.org totalTime. Returns undefined when unparseable.
function toISODuration(s?: string): string | undefined {
  if (!s) return undefined
  const n = parseInt(s.replace(/[.,]/g, ''), 10)
  if (!Number.isFinite(n)) return undefined
  if (/tim|hour|hr/i.test(s)) return `PT${n}H`
  if (/min/i.test(s)) return `PT${n}M`
  if (/sek|sec/i.test(s)) return `PT${n}S`
  if (/dag|day/i.test(s)) return `P${n}D`
  return undefined
}

export function HowToBlock({ value }: HowToBlockProps) {
  if (!value?.items?.length) return null

  const intro = value.intro?.trim()
  const duration = value.duration?.trim()
  const isoDuration = toISODuration(duration)

  // Emit HowTo structured data from the steps (mirrors the FAQ block's FAQPage schema).
  const steps = value.items.filter((s) => s?.title || hasBody(s?.body))
  const howToSchema = steps.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: value.title || 'Sådan gør du',
    ...(isoDuration ? { totalTime: isoDuration } : {}),
    step: steps.map((s, i) => {
      const text = bodyToText(s.body)
      return {
        '@type': 'HowToStep',
        position: i + 1,
        name: s.title || `Trin ${i + 1}`,
        ...(text ? { text } : {}),
      }
    }),
  } : null

  return (
    <div id="how-to" className="scroll-anchor sg-howto">
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}

      <div className="sg-howto-head">
        {value.title && <h2 className="sg-howto-title">{value.title}</h2>}
        <div className="sg-howto-meta">
          {duration && (
            <span><Icon name="clock-circle" size={15} />{duration}</span>
          )}
          <span><Icon name="list-check" size={15} />{value.items.length} trin</span>
        </div>
        {intro && <p className="sg-howto-intro">{intro}</p>}
      </div>

      <ol className="sg-steps">
        {value.items.map((item, i) => (
          <li key={i} className="sg-step">
            <span className="sg-step-marker" aria-hidden="true">{i + 1}</span>
            <div className="sg-step-body">
              {item.title && (
                <h3 className="sg-step-title">
                  <span className="visually-hidden">Trin {i + 1}: </span>{item.title}
                </h3>
              )}
              {hasBody(item.body) && (
                Array.isArray(item.body)
                  ? <div className="sg-step-text"><PortableText value={item.body} components={stepBodyComponents} /></div>
                  : <div className="sg-step-text"><p>{item.body as string}</p></div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
