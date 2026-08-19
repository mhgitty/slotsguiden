interface HowToItem {
  title?: string
  body?: string
}

interface HowToBlockProps {
  value: {
    title?: string
    items?: HowToItem[]
  }
}

export function HowToBlock({ value }: HowToBlockProps) {
  if (!value?.items?.length) return null

  // Emit HowTo structured data from the steps (mirrors the FAQ block's FAQPage schema).
  const steps = value.items.filter((s) => s?.title || s?.body)
  const howToSchema = steps.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: value.title || 'Sådan gør du',
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

      {value.title && (
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          marginBottom: '16px',
        }}>
          {value.title}
        </h2>
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
