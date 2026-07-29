import { PortableText } from '@portabletext/react'
import { Icon } from '@/components/Icon'

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

interface CasinoKortData {
  customTitle?: string
  customBody?: any[]
  imageUrl?: string | null
  pros?: string[]
  cons?: string[]
  bookmaker?: {
    name: string
    score: number | null
    logoUrl: string | null
    logoAlt: string | null
    url: string
  }
}

export function CasinoKort({ value }: { value: CasinoKortData }) {
  const bm = value.bookmaker
  if (!bm) return null

  const name = value.customTitle || bm.name
  const stars = bm.score ? Math.round(bm.score / 2) : null
  const hasPros = (value.pros?.length ?? 0) > 0
  const hasCons = (value.cons?.length ?? 0) > 0

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', margin: '24px 0' }}>
      <div style={{ padding: '20px' }}>

        {/* Logo + name + score */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          {bm.logoUrl && (
            <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={bm.logoUrl} alt={bm.logoAlt || name} style={{ width: '60px', height: '60px', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px' }}>{name}</h3>
            {stars !== null && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                <span style={{ marginLeft: '4px' }}>{bm.score?.toFixed(1)}/10</span>
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

        {/* Pros & Cons */}
        {(hasPros || hasCons) && (
          <div className="pros-cons-grid">
            {hasPros && (
              <div style={{ flex: 1, minWidth: '140px', border: '1px solid rgba(10,95,62,0.35)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Icon name="check-circle" size={14} color="var(--green)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Fordele</span>
                </div>
                {value.pros!.map((pro, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.5 }}>
                    <Icon name="check-circle" size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: '1px' }} /><span>{pro}</span>
                  </div>
                ))}
              </div>
            )}
            {hasCons && (
              <div style={{ flex: 1, minWidth: '140px', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Icon name="close-circle" size={14} color="#ef4444" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ulemper</span>
                </div>
                {value.cons!.map((con, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.5 }}>
                    <Icon name="close-circle" size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} /><span>{con}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {bm.url && (
          <a href={bm.url} target="_blank" rel="nofollow noopener noreferrer sponsored"
            style={{ display: 'block', background: 'var(--btn)', color: '#fff', padding: '13px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
            Besøg casino →
          </a>
        )}

      </div>
    </div>
  )
}
