import Link from 'next/link'
import { replaceDateVars } from '@/lib/dateVars'

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Brødkrummer" style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '20px', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', rowGap: '2px' }}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        const label = replaceDateVars(crumb.label)
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: isLast ? 'normal' : 'nowrap' }}>
            {isLast || !crumb.href ? (
              <span style={{ color: isLast ? 'var(--text-muted)' : 'var(--text-faint)', wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal' }}>{label}</span>
            ) : (
              <Link href={crumb.href} className="breadcrumb-link">
                {label}
              </Link>
            )}
            {!isLast && <span style={{ margin: '0 6px', opacity: 0.5, flexShrink: 0 }}>›</span>}
          </span>
        )
      })}
    </nav>
  )
}
