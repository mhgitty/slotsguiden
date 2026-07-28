'use client'
import { usePathname } from 'next/navigation'

export function PreviewBanner() {
  const pathname = usePathname()
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 9999,
      background: '#111827', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
      padding: '8px 16px', fontSize: '13px', fontWeight: 500,
      borderBottom: '2px solid var(--green)',
    }}>
      <span>
        <strong style={{ color: 'var(--green-light)' }}>Forhåndsvisning</strong> — du ser upublicerede udkast.
      </span>
      <a
        href={`/api/preview/disable?slug=${encodeURIComponent(pathname || '/')}`}
        style={{
          background: '#fff', color: '#111827', textDecoration: 'none',
          padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '12.5px',
        }}
      >
        Afslut forhåndsvisning
      </a>
    </div>
  )
}
