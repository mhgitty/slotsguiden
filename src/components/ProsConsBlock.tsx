import { Icon } from '@/components/Icon'

interface ProsConsBlockProps { value: { title?: string; pros?: string[]; cons?: string[] } }

export function ProsConsBlock({ value }: ProsConsBlockProps) {
  const { title, pros = [], cons = [] } = value
  return (
    <div id="pros-cons" className="scroll-anchor" style={{ margin: '24px 0' }}>
      {title && <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>{title}</h3>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'rgba(10,95,62,0.08)', border: '1px solid rgba(10,95,62,0.2)', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <Icon name="check-circle" size={15} color="var(--green)" /> Fordele
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pros.map((p, i) => (
              <li key={i} style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Icon name="check-circle" size={15} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <Icon name="close-circle" size={15} color="#f87171" /> Ulemper
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cons.map((c, i) => (
              <li key={i} style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Icon name="close-circle" size={15} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
