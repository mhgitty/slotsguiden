import { Icon } from '@/components/Icon'

interface HowToItem {
  title?: string
  body?: string
}

interface HowToBlockProps {
  value: {
    title?: string
    intro?: string
    duration?: string
    items?: HowToItem[]
  }
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
  const steps = value.items.filter((s) => s?.title || s?.body)
  const howToSchema = steps.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: value.title || 'Sådan gør du',
    ...(isoDuration ? { totalTime: isoDuration } : {}),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title || `Trin ${i + 1}`,
      ...(s.body ? { text: s.body } : {}),
    })),
  } : null

  return (
    <div id="how-to" className="scroll-anchor" style={{ margin: '32px 0' }}>
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}

      {(value.title || duration) && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: intro ? '10px' : '16px' }}>
          {value.title && (
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}>
              {value.title}
            </h2>
          )}
          {duration && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--green-light)',
              color: 'var(--green-dark)',
              fontSize: '13px',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}>
              <Icon name="clock-circle" size={15} color="var(--green-dark)" />
              {duration}
            </span>
          )}
        </div>
      )}

      {intro && (
        <p style={{
          fontSize: '15.5px',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          margin: '0 0 20px',
          maxWidth: '760px',
        }}>
          {intro}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {value.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '22px 24px',
          }}>
            {/* Round number badge */}
            <div style={{
              width: '44px',
              height: '44px',
              background: 'var(--green)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1,
              }}>
                {i + 1}
              </span>
            </div>

            {/* Title + description stacked; description lines up under the title */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
              {item.title && (
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(17px, 2vw, 20px)',
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: item.body ? '0 0 8px' : '0',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25,
                }}>
                  {item.title}
                </h3>
              )}
              {item.body && (
                <p style={{
                  fontSize: '14.5px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.75,
                  margin: 0,
                }}>
                  {item.body}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
