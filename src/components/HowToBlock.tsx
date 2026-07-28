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

  return (
    <div style={{ margin: '32px 0' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {value.items.map((item, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '52px 1fr',
            gap: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '22px',
            alignItems: 'flex-start',
          }}>
            {/* Number badge */}
            <div style={{
              width: '52px',
              height: '52px',
              background: 'var(--green)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1,
              }}>
                {i + 1}
              </span>
            </div>

            {/* Content */}
            <div>
              {item.title && (
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: '0 0 8px',
                  letterSpacing: '-0.01em',
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
