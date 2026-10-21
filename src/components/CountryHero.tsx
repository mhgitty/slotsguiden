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
    <section className="hero-section country-hero">
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

            <span className="hero-eyebrow">
              <i aria-hidden="true" />
              {replaceDateVars('Opdateret [month] [year]')}
            </span>

            <h1 className="country-hero-title" style={{ marginBottom: hasIntro ? '16px' : '0' }}>
              {replaceDateVars(title)}
            </h1>

            {hasIntro && (
              <p className="country-hero-intro">
                <RichIntro value={typeof intro === 'string' ? replaceDateVars(intro) : intro} maxWords={50} />
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
                    <span className="country-hero-card-icon">
                      {card.icon ? <Icon name={card.icon} size={22} color="var(--green)" /> : null}
                    </span>

                    <span className="country-hero-card-row">
                      <span className="country-hero-card-title">{card.title}</span>
                      <span className="country-hero-card-arrow" aria-hidden="true">
                        <Icon name="arrow-right" size={15} />
                      </span>
                    </span>
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
