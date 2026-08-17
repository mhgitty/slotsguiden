import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { RichIntro } from '@/components/RichIntro'
import { CasinoReviewsArchive } from '@/components/CasinoReviewsArchive'
import { GuidesArchive } from '@/components/GuidesArchive'
import {
  getBookmakers,
  getPaymentMethods,
  getSoftwareProviders,
  getCasinoGuides,
} from '@/lib/sanity'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SectionBase { _type: string; _key: string }

interface SectionCasinoList     extends SectionBase { _type: 'sectionCasinoList';     title?: string; count?: number }
interface SectionReviewsArchive extends SectionBase { _type: 'sectionReviewsArchive'; title?: string; intro?: any[]; count?: number }
interface SectionGuidesArchive  extends SectionBase { _type: 'sectionGuidesArchive';  title?: string; intro?: any[]; count?: number }
interface SectionPaymentMethods extends SectionBase { _type: 'sectionPaymentMethods'; title?: string; intro?: any[] }
interface SectionSoftware       extends SectionBase { _type: 'sectionSoftware';       title?: string; intro?: any[] }
interface SectionCtaBanner      extends SectionBase { _type: 'sectionCtaBanner';      icon?: string; title: string; body?: string; buttonLabel?: string; buttonUrl?: string; style?: string }
interface SectionHighlights     extends SectionBase { _type: 'sectionHighlights';     title?: string; intro?: string; items?: { _key: string; title: string; bullets?: string[] }[] }
interface SectionGameTypes      extends SectionBase { _type: 'sectionGameTypes';      title?: string; items?: { _key: string; title: string; description?: string; icon?: string; href?: string }[] }

type AnySection = SectionCasinoList | SectionReviewsArchive | SectionGuidesArchive | SectionPaymentMethods | SectionSoftware | SectionCtaBanner | SectionHighlights | SectionGameTypes

// ── Casino list ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'var(--green)' : score >= 6 ? '#ca8a04' : '#dc2626'
  return (
    <span style={{ display: 'inline-block', background: color, color: '#fff', fontSize: '12px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px' }}>
      ★ {score.toFixed(1)}
    </span>
  )
}

function CasinoListSection({ bookmakers, section, reviewBase, listBase }: {
  bookmakers: any[]
  section: SectionCasinoList
  reviewBase: string
  listBase: string
}) {
  const count = section.count ?? 5
  const title = section.title || 'Højest rangerede casinoer'
  const visible = bookmakers.slice(0, count)

  return (
    <div className="section">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visible.map((bm: any, i: number) => (
          <div key={bm._id} style={{
            background: 'var(--bg-card)',
            border: i === 0 ? '2px solid var(--green)' : '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {i === 0 && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                background: 'var(--green)', color: '#fff',
                fontSize: '11px', fontWeight: 700, textAlign: 'center',
                padding: '3px 0', letterSpacing: '0.5px',
              }}>TOP RATED</div>
            )}
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 100px 1fr auto',
              gap: '16px', padding: i === 0 ? '32px 24px 20px' : '20px 24px',
              alignItems: 'center',
            }} className="bookmaker-card-inner">
              <div style={{ fontSize: '18px', fontWeight: 800, color: i < 3 ? 'var(--green)' : 'var(--text-faint)', textAlign: 'center' }}>
                #{i + 1}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {bm.logo?.url ? (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '6px 10px', border: '1px solid var(--border-faint)' }}>
                    <Image src={bm.logo.url} alt={bm.logo.alt || bm.name} width={80} height={40}
                      style={{ objectFit: 'contain', maxHeight: '40px', width: 'auto', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '40px', background: 'var(--bg-raised)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-faint)' }}>
                    {bm.name}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{bm.name}</span>
                  {bm.score != null && <ScoreBadge score={bm.score} />}
                </div>
                {bm.usp && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>{bm.usp}</p>}
                {bm.indbetalingsbonus && (
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}>{bm.indbetalingsbonus}</div>
                )}
                {bm.terms && (
                  <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px', lineHeight: 1.4 }}>{bm.terms}</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                {bm.url && (
                  <a href={bm.url} target="_blank" rel="nofollow noopener noreferrer sponsored"
                    style={{ display: 'inline-block', background: 'var(--btn)', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Tilmeld dig →
                  </a>
                )}
                <Link href={`${reviewBase}/${bm.slug.current}/`}
                  style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Læs anmeldelse
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {bookmakers.length > count && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href={listBase}
            style={{ display: 'inline-block', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
            Se alle {bookmakers.length} casinoer →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CtaBannerSection({ section }: { section: SectionCtaBanner }) {
  const style = section.style || 'green'

  const bgMap: Record<string, string> = {
    green:  'linear-gradient(135deg, var(--green) 0%, #16a34a 100%)',
    dark:   'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    light:  'var(--bg-raised)',
  }
  const textColor = style === 'light' ? 'var(--text)' : '#fff'
  const subColor  = style === 'light' ? 'var(--text-muted)' : 'rgba(255,255,255,0.8)'
  const btnBg     = style === 'light' ? 'var(--green)' : '#fff'
  const btnColor  = style === 'light' ? '#fff' : (style === 'green' ? 'var(--green-dark)' : style === 'purple' ? '#7c3aed' : '#1e293b')

  return (
    <div style={{
      background: bgMap[style] || bgMap.green,
      padding: '56px 24px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {section.icon && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <Icon name={section.icon} size={40} color={textColor} />
          </div>
        )}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: textColor, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          {section.title}
        </h2>
        {section.body && (
          <p style={{ fontSize: '15px', color: subColor, lineHeight: 1.7, marginBottom: '24px' }}>
            {section.body}
          </p>
        )}
        {section.buttonLabel && section.buttonUrl && (
          <Link href={section.buttonUrl} style={{
            display: 'inline-block',
            background: btnBg,
            color: btnColor,
            padding: '13px 28px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {section.buttonLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Highlights ────────────────────────────────────────────────────────────────

function HighlightsSection({ section }: { section: SectionHighlights }) {
  return (
    <div className="section">
      {section.title && (
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: section.intro ? '8px' : '20px', textAlign: 'center' }}>
          {section.title}
        </h2>
      )}
      {section.intro && (
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, textAlign: 'center', marginBottom: '24px', maxWidth: '680px', margin: '0 auto 24px' }}>
          {section.intro}
        </p>
      )}
      {section.items && section.items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {section.items.map((item) => (
            <div key={item._key} style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
                {item.title}
              </div>
              {item.bullets && item.bullets.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.bullets.map((bullet, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <Icon name="check-circle" size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Game Types ────────────────────────────────────────────────────────────────

function GameTypesSection({ section }: { section: SectionGameTypes }) {
  return (
    <div className="section">
      {section.title && (
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px', textAlign: 'center' }}>
          {section.title}
        </h2>
      )}
      {section.items && section.items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {section.items.map((item) => {
            const inner = (
              <div key={item._key} style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '24px',
                transition: 'border-color 0.15s',
              }}>
                {item.icon && (
                  <div style={{ marginBottom: '12px' }}>
                    <Icon name={item.icon} size={28} color="var(--green)" />
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                  {item.title}
                </div>
                {item.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {item.description}
                  </p>
                )}
              </div>
            )
            return item.href ? (
              <Link key={item._key} href={item.href} style={{ textDecoration: 'none' }}>{inner}</Link>
            ) : <div key={item._key}>{inner}</div>
          })}
        </div>
      )}
    </div>
  )
}

// ── Provider cards (payment methods / software) ───────────────────────────────

const MAX_DESKTOP = 8
const MAX_MOBILE  = 4

function ProviderCardsSection({
  section,
  items,
  hrefPrefix,
  seeAllLabel,
  seeAllHref,
  casinoLabel,
}: {
  section: SectionPaymentMethods | SectionSoftware
  items: any[]
  hrefPrefix: string
  seeAllLabel: string
  seeAllHref: string
  casinoLabel: string
}) {
  const visible = items.slice(0, MAX_DESKTOP)
  const hasMore = items.length > MAX_DESKTOP

  return (
    <div className="section">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: section.intro ? '12px' : '20px', flexWrap: 'wrap' }}>
        {section.title && (
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {section.title}
          </h2>
        )}
        <Link href={seeAllHref} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {seeAllLabel} →
        </Link>
      </div>

      {/* Optional rich intro */}
      {section.intro && section.intro.length > 0 && (
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 20px' }}>
          <RichIntro value={section.intro} />
        </p>
      )}

      {/* Cards grid */}
      <div className="provider-cards-grid">
        {visible.map((item: any, i: number) => {
          const isDesktopOnly = i >= MAX_MOBILE
          return (
            <Link
              key={item._id}
              href={`${hrefPrefix}/${item.slug.current}/`}
              className={`provider-card${isDesktopOnly ? ' provider-card--desktop-only' : ''}`}
            >
              {/* Logo area */}
              <div style={{
                width: '100%', height: '90px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
                padding: '10px',
                overflow: 'hidden',
              }}>
                {item.logo?.url ? (
                  <Image
                    src={item.logo.url}
                    alt={item.logo.alt || item.name}
                    width={120}
                    height={70}
                    style={{ objectFit: 'contain', maxHeight: '70px', width: 'auto' }}
                  />
                ) : (
                  <div style={{
                    width: '64px', height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(34,197,94,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', fontWeight: 800, color: 'var(--green)',
                    fontFamily: 'var(--font-display)',
                  }}>
                    {item.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name + arrow row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%', marginBottom: '4px' }}>
                <span style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                  {item.name}
                </span>
                <div style={{
                  flexShrink: 0,
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="alt-arrow-right" size={14} color="#fff" />
                </div>
              </div>

              {/* Casino count */}
              {item.casinoCount != null && (
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', width: '100%' }}>
                  <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{item.casinoCount}</strong>
                  {' '}{casinoLabel}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* See all button */}
      {(hasMore || true) && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href={seeAllHref} style={{
            display: 'inline-block',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '14px', fontWeight: 600, color: 'var(--text)',
            textDecoration: 'none',
          }}>
            {seeAllLabel}
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function HomeSections({ sections }: { sections: AnySection[] }) {
  if (!sections || sections.length === 0) return null

  // Pre-fetch data for data-driven sections
  const needsBookmakers = sections.some(s => s._type === 'sectionCasinoList')
  const needsPayments   = sections.some(s => s._type === 'sectionPaymentMethods')
  const needsSoftware   = sections.some(s => s._type === 'sectionSoftware')
  const needsReviews    = sections.some(s => s._type === 'sectionReviewsArchive')
  const needsGuides     = sections.some(s => s._type === 'sectionGuidesArchive')

  const [bookmakers, payments, software, reviewCasinos, guides] = await Promise.all([
    needsBookmakers
      ? getBookmakers().catch(() => [])
      : Promise.resolve([]),
    needsPayments
      ? getPaymentMethods().catch(() => [])
      : Promise.resolve([]),
    needsSoftware
      ? getSoftwareProviders().catch(() => [])
      : Promise.resolve([]),
    needsReviews
      ? getBookmakers().catch(() => [])
      : Promise.resolve([]),
    needsGuides
      ? getCasinoGuides().catch(() => [])
      : Promise.resolve([]),
  ])

  const reviewBase = '/online-casino'
  const listBase   = '/online-casino/'
  const payBase    = '/betalingsmetoder'
  const softBase   = '/spiludviklere'
  const guideBase  = '/guides'

  return (
    <>
      {sections.map((section) => {
        switch (section._type) {
          case 'sectionCasinoList':
            return (bookmakers as any[]).length > 0 ? (
              <CasinoListSection
                key={section._key}
                bookmakers={bookmakers as any[]}
                section={section}
                reviewBase={reviewBase}
                listBase={listBase}
              />
            ) : null

          case 'sectionReviewsArchive': {
            const sec = section as SectionReviewsArchive
            const all = reviewCasinos as any[]
            if (all.length === 0) return null
            const max = sec.count ?? 4
            return (
              <CasinoReviewsArchive
                key={section._key}
                casinos={all.slice(0, max)}
                hrefPrefix={reviewBase}
                title={sec.title || 'Casinoanmeldelser'}
                intro={sec.intro ? <RichIntro value={sec.intro} /> : undefined}
                seeAllHref={all.length > max ? listBase : undefined}
              />
            )
          }

          case 'sectionGuidesArchive': {
            const sec = section as SectionGuidesArchive
            const all = guides as any[]
            if (all.length === 0) return null
            const gmax = sec.count ?? 4
            return (
              <GuidesArchive
                key={section._key}
                guides={all.slice(0, gmax)}
                hrefPrefix={guideBase}
                title={sec.title || 'Casinoguider'}
                intro={sec.intro ? <RichIntro value={sec.intro} /> : undefined}
                seeAllHref={all.length > gmax ? `${guideBase}/` : undefined}
              />
            )
          }

          case 'sectionPaymentMethods':
            return (payments as any[]).length > 0 ? (
              <ProviderCardsSection
                key={section._key}
                section={section as SectionPaymentMethods}
                items={payments as any[]}
                hrefPrefix={payBase}
                seeAllLabel="Se alle betalingsmetoder"
                seeAllHref={`${payBase}/`}
                casinoLabel="casinoer"
              />
            ) : null

          case 'sectionSoftware':
            return (software as any[]).length > 0 ? (
              <ProviderCardsSection
                key={section._key}
                section={section as SectionSoftware}
                items={software as any[]}
                hrefPrefix={softBase}
                seeAllLabel="Se alle spiludviklere"
                seeAllHref={`${softBase}/`}
                casinoLabel="casinoer"
              />
            ) : null

          case 'sectionCtaBanner':
            return <CtaBannerSection key={section._key} section={section} />

          case 'sectionHighlights':
            return <HighlightsSection key={section._key} section={section as SectionHighlights} />

          case 'sectionGameTypes':
            return <GameTypesSection key={section._key} section={section as SectionGameTypes} />

          default:
            return null
        }
      })}
    </>
  )
}
