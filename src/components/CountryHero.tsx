import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { RichIntro } from '@/components/RichIntro'
import { replaceDateVars } from '@/lib/dateVars'

interface HeroCard {
  _key: string
  title: string
  icon?: string
  href: string
}

interface Crumb { label: string; href?: string }

interface CountryHeroProps {
  title: string
  intro?: string | any[]
  heroCards?: HeroCard[]
  breadcrumbs?: Crumb[]
}

export function CountryHero({ title, intro, heroCards, breadcrumbs }: CountryHeroProps) {
  const hasCards = heroCards && heroCards.length > 0
  const hasIntro = Array.isArray(intro) ? intro.length > 0 : !!intro

  return (
    <section className="hero-section country-hero" style={{
      background: 'var(--bg-hero)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
        <div className="country-hero-inner">

          {/* ── Left: title + intro ── */}
          <div className="country-hero-left">
            {breadcrumbs && breadcrumbs.length > 0 && (
              // Kept in the DOM for accessibility + breadcrumb markup, hidden visually.
              <div className="visually-hidden">
                <Breadcrumbs crumbs={breadcrumbs} />
              </div>
            )}

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.8vw, 48px)',
              fontWeight: 800,
              color: 'var(--text)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: hasIntro ? '16px' : '0',
            }}>
              {replaceDateVars(title)}
            </h1>

            {hasIntro && (
              <p style={{
                fontSize: '15px',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: '640px',
              }}>
                {typeof intro === 'string' ? replaceDateVars(intro) : <RichIntro value={intro} />}
              </p>
            )}
          </div>

          {/* ── Right: nav cards ── */}
          {hasCards && (
            <div className="country-hero-right">
              <div className="country-hero-cards">
                {heroCards!.map((card) => (
                  <Link
                    key={card._key}
                    href={card.href}
                    className="country-hero-card"
                  >
                    {/* Icon */}
                    <div style={{ marginBottom: '16px' }}>
                      {card.icon ? (
                        <Icon name={card.icon} size={40} color="var(--green)" />
                      ) : (
                        <div style={{
                          width: '40px', height: '40px',
                          borderRadius: '10px',
                          background: 'rgba(34,197,94,0.12)',
                        }} />
                      )}
                    </div>

                    {/* Title + arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '19px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        lineHeight: 1.3,
                      }}>
                        {card.title}
                      </span>
                      <div style={{
                        flexShrink: 0,
                        width: '30px', height: '30px',
                        borderRadius: '50%',
                        background: 'var(--green)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="alt-arrow-right" size={15} color="#fff" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
