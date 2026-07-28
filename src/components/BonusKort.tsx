import { PortableText } from '@portabletext/react'

const bodyComponents = {
  block: { normal: ({ children }: any) => <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.65 }}>{children}</p> },
  list: {
    bullet: ({ children }: any) => <ul style={{ paddingLeft: '18px', margin: '0 0 8px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</ul>,
    number: ({ children }: any) => <ol style={{ paddingLeft: '18px', margin: '0 0 8px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</ol>,
  },
  listItem: { bullet: ({ children }: any) => <li>{children}</li>, number: ({ children }: any) => <li>{children}</li> },
  marks: {
    strong: ({ children }: any) => <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
  },
}

interface BonusKortData {
  customTitle?: string
  customBody?: any[]
  imageUrl?: string | null
  bonus?: {
    name: string
    bonusText: string
    logoUrl: string | null
    logoAlt: string | null
    score: number | null
    offerUrl: string
    terms: string | null
  }
}

export function BonusKort({ value }: { value: BonusKortData }) {
  const bonus = value.bonus
  if (!bonus) return null

  const name = value.customTitle || bonus.name
  const stars = bonus.score ? Math.round(bonus.score / 2) : null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', margin: '24px 0' }}>
      <div style={{ padding: '20px' }}>

        {/* Logo + name + bonus text + score */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          {bonus.logoUrl && (
            <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={bonus.logoUrl} alt={bonus.logoAlt || name} style={{ width: '60px', height: '60px', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px' }}>{name}</h3>
            {bonus.bonusText && (
              <div style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 600, marginBottom: '3px' }}>{bonus.bonusText}</div>
            )}
            {stars !== null && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                <span style={{ marginLeft: '4px' }}>{bonus.score?.toFixed(1)}/10</span>
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        {value.imageUrl && (
          <img src={value.imageUrl} alt={name} style={{ width: '100%', borderRadius: '8px', display: 'block', marginBottom: '14px', maxHeight: '260px', objectFit: 'cover' }} />
        )}

        {/* Rich text body */}
        {value.customBody && value.customBody.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <PortableText value={value.customBody} components={bodyComponents} />
          </div>
        )}

        {/* CTA */}
        {bonus.offerUrl && (
          <a href={bonus.offerUrl} target="_blank" rel="nofollow noopener noreferrer sponsored"
            style={{ display: 'block', background: 'var(--green-dark)', color: '#fff', padding: '13px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', textAlign: 'center', marginBottom: bonus.terms ? '10px' : '0' }}>
            Hent bonus nu →
          </a>
        )}

        {/* Terms */}
        {bonus.terms && (
          <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: 0, lineHeight: 1.5 }}>{bonus.terms}</p>
        )}

      </div>
    </div>
  )
}
