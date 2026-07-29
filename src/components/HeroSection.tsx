import { replaceDateVars } from '@/lib/dateVars'
import { Breadcrumbs } from './Breadcrumbs'
import { AuthorBar } from './AuthorBar'
import { RichIntro } from './RichIntro'

interface Crumb { label: string; href?: string }

interface HeroSectionProps {
  title: string
  intro?: string | any[]
  eyebrow?: string
  updatedAt?: string | null
  narrow?: boolean
  author?: { name: string; slug?: { current: string } | null; linkedin?: string | null; imageUrl?: string | null } | null
  factChecker?: { name: string; slug?: { current: string } | null; linkedin?: string | null; imageUrl?: string | null } | null
  breadcrumbs?: Crumb[]
}

export function HeroSection({ title, intro, eyebrow, updatedAt, narrow = false, author, factChecker, breadcrumbs }: HeroSectionProps) {
  const maxWidth = narrow ? '760px' : '1250px'
  const hasAuthorBar = author || factChecker || updatedAt
  const hasIntro = Array.isArray(intro) ? intro.length > 0 : !!intro

  return (
    <section className="hero-section" style={{
      background: 'var(--bg-hero)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth, margin: '0 auto' }}>

        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs crumbs={breadcrumbs} />}

        {eyebrow && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(10,95,62,0.12)', color: 'var(--green)',
            fontSize: '12px', fontWeight: 600,
            padding: '4px 12px', borderRadius: '20px',
            marginBottom: '16px',
          }}>
            {eyebrow}
          </div>
        )}

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 3.5vw, 40px)',
          fontWeight: 800, color: 'var(--text)',
          lineHeight: 1.15, letterSpacing: '-0.03em',
          marginBottom: hasAuthorBar ? '20px' : hasIntro ? '16px' : '0',
          width: '100%',
        }}>
          {replaceDateVars(title)}
        </h1>

        <AuthorBar author={author} factChecker={factChecker} updatedAt={updatedAt} />

        {hasIntro && (
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, width: '100%', margin: 0 }}>
            {typeof intro === 'string' ? replaceDateVars(intro) : <RichIntro value={intro} />}
          </p>
        )}

      </div>
    </section>
  )
}
