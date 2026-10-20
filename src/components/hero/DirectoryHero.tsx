import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'
import { RichIntro } from '@/components/RichIntro'
import { replaceDateVars } from '@/lib/dateVars'

export interface DirStat { icon: string; label: string; value?: string | null }

interface Props {
  kind: 'payment' | 'software'
  name: string
  title: string
  logo?: { url?: string; alt?: string } | null
  intro?: string | any[] | null
  stats: DirStat[]
  cats?: string[]
  /** First casino in the page's comparison list */
  topPick?: any | null
  casinoCount: number
  listAnchor?: string
  crumbs: { label: string; href?: string }[]
}

const KIND = {
  payment: { chip: 'Betalingsmetode', icon: 'card', pick: (n: string) => `Bedst med ${n}` },
  software: { chip: 'Spiludvikler', icon: 'gamepad', pick: (n: string) => `Bedst til ${n}` },
}

// Shared hero for payment-method and game-provider pages
export function DirectoryHero({ kind, name, title, logo, intro, stats, cats, topPick, casinoCount, listAnchor = 'casino-liste', crumbs }: Props) {
  const k = KIND[kind]
  const shown = stats.filter((s) => s.value && String(s.value).trim())
  const hasIntro = Array.isArray(intro) ? intro.length > 0 : !!intro
  const pickLogo = topPick?.logoSquare?.url || topPick?.logo?.url
  const pickStats = topPick ? [
    topPick.minIndbetaling != null ? `Min. indbetaling ${topPick.minIndbetaling} kr.` : null,
    topPick.gennemspilskrav ? `${topPick.gennemspilskrav} omsætningskrav` : null,
  ].filter(Boolean).join(' · ') : ''

  return (
    <div className="mh-band">
      <div className="mh-wrap">
        <Breadcrumbs crumbs={crumbs} />
        <div className={`mh-grid${topPick ? '' : ' no-side'}`}>
          <div className="mh-card">
            <div className="mh-pad">
              <div className="mh-head two">
                <div className="mh-logotile">
                  {logo?.url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logo.url} alt={logo.alt || name} />
                    : <span>{name.slice(0, 2)}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="mh-chips">
                    <span className="mh-chip"><Icon name={k.icon} size={13} />{k.chip}</span>
                    {casinoCount > 0 && <span className="mh-chip grey">{casinoCount} casinoer</span>}
                  </div>
                  <h1 className="mh-h1">{title}</h1>
                </div>
              </div>
              {hasIntro && (
                <p className="mh-intro">{typeof intro === 'string' ? replaceDateVars(intro) : <RichIntro value={intro} />}</p>
              )}
              {shown.length > 0 && (
                <div className="mh-stats">
                  {shown.map((s) => (
                    <div key={s.label} className="mh-stat">
                      <i><Icon name={s.icon} size={18} /></i>
                      <div><small>{s.label}</small><b>{s.value}</b></div>
                    </div>
                  ))}
                </div>
              )}
              {cats && cats.length > 0 && (
                <div className="mh-cats">{cats.map((c) => <span key={c}>{c}</span>)}</div>
              )}
            </div>
          </div>

          {topPick && (
            <aside className="mh-pick">
              <div className="mh-pick-label">{k.pick(name)}</div>
              <div className="mh-pick-head">
                {pickLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={pickLogo} alt={topPick.name} width={52} height={52} />
                  : null}
                <div>
                  {topPick.slug?.current
                    ? <Link href={`/online-casino/${topPick.slug.current}/`}>{topPick.name}</Link>
                    : <span className="n">{topPick.name}</span>}
                  {topPick.score != null && (
                    <span className="mh-stars"><Icon name="star" size={13} color="var(--gold)" />{topPick.score.toFixed(1)}<span>/10</span></span>
                  )}
                </div>
              </div>
              {topPick.indbetalingsbonus && <div className="mh-pick-offer">{replaceDateVars(topPick.indbetalingsbonus)}</div>}
              {pickStats && <div className="mh-pick-sub">{pickStats}</div>}
              {topPick.url && (
                <a className="sg-cta" href={topPick.url} target="_blank" rel="nofollow noopener noreferrer sponsored">
                  Hent bonus <Icon name="arrow-right" size={16} color="#fff" />
                </a>
              )}
              <div className="mh-pick-terms"><Terms html={topPick.terms || '18+ | Regler og vilkår gælder | Spil ansvarligt | StopSpillet.dk'} /></div>
              {casinoCount > 1 && (
                <a className="mh-alllink" href={`#${listAnchor}`}>
                  Se alle {casinoCount} {name} casinoer <Icon name="arrow-down" size={14} />
                </a>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
