'use client'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'
import { replaceDateVars } from '@/lib/dateVars'
import type { NavItem, NavLink, FeaturedCasino } from './types'

const DEFAULT_TERMS = '18+ | Regler og vilkår gælder | Spil ansvarligt | StopSpillet.dk'
const WEEKDAYS = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
const CHIP_LIMIT = 10

const weekdayOf = (label: string) => WEEKDAYS.findIndex((d) => label.toLowerCase().includes(d))
const isWeekdayGroup = (g: NavLink) => (g.children?.length ?? 0) >= 5 && g.children!.every((c) => weekdayOf(c.label) >= 0)

function LinkRow({ link, onNavigate }: { link: NavLink; onNavigate: () => void }) {
  return (
    <Link href={link.href} className="mm-link" onClick={onNavigate}>
      <span className="mm-link-ico"><Icon name={link.icon || 'alt-arrow-right'} size={19} /></span>
      <span className="mm-link-text">
        <b>{link.label}</b>
        {link.description && <small>{link.description}</small>}
      </span>
    </Link>
  )
}

function ChipGroup({ group, onNavigate, column }: { group: NavLink; onNavigate: () => void; column?: boolean }) {
  const kids = group.children ?? []
  const shown = kids.slice(0, CHIP_LIMIT)
  return (
    <div className={column ? 'mm-col' : 'mm-chipgroup'}>
      <Link href={group.href} className="mm-label mm-label-link" onClick={onNavigate}>{group.label}</Link>
      <div className="mm-chips">
        {shown.map((c) => <Link key={c.href + c.label} href={c.href} className="mm-chip" onClick={onNavigate}>{c.label}</Link>)}
      </div>
      {kids.length > shown.length && (
        <Link href={group.href} className="mm-more" onClick={onNavigate}>
          Se alle {kids.length} <Icon name="arrow-right" size={14} />
        </Link>
      )}
    </div>
  )
}

function DaysGroup({ group, today, onNavigate }: { group: NavLink; today: number; onNavigate: () => void }) {
  return (
    <div className="mm-days">
      <div className="mm-days-top">
        <Link href={group.href} className="mm-days-title" onClick={onNavigate}>
          <Icon name={group.icon || 'calendar'} size={17} /> {group.label}
        </Link>
        {group.description && <small>{group.description}</small>}
      </div>
      <div className="mm-days-row">
        {group.children!.map((d) => {
          const isToday = weekdayOf(d.label) === today
          const short = WEEKDAYS[weekdayOf(d.label)]
          return (
            <Link key={d.href + d.label} href={d.href} onClick={onNavigate} className={`mm-day${isToday ? ' is-today' : ''}`}>
              {short.charAt(0).toUpperCase() + short.slice(1)}{isToday ? ' · i dag' : ''}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function Featured({ casino, label, onNavigate }: { casino: FeaturedCasino; label?: string; onNavigate: () => void }) {
  const stats = [
    casino.minIndbetaling != null ? `Min. indbetaling ${casino.minIndbetaling} kr.` : null,
    casino.gennemspilskrav ? `${casino.gennemspilskrav} omsætningskrav` : null,
  ].filter(Boolean).join(' · ')
  return (
    <aside className="mm-feat">
      <div className="mm-feat-label">{label || 'Anbefalet casino'}</div>
      <div className="mm-feat-head">
        {casino.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={casino.logo} alt={casino.name} width={52} height={52} loading="lazy" />
        )}
        <div>
          {casino.slug
            ? <Link href={`/online-casino/${casino.slug}/`} className="mm-feat-name" onClick={onNavigate}>{casino.name}</Link>
            : <span className="mm-feat-name">{casino.name}</span>}
          {casino.score != null && (
            <span className="mm-stars"><Icon name="star" size={14} color="var(--gold)" />{casino.score.toFixed(1)}<span>/10</span></span>
          )}
        </div>
      </div>
      {casino.indbetalingsbonus && <div className="mm-feat-offer">{replaceDateVars(casino.indbetalingsbonus)}</div>}
      {stats && <div className="mm-feat-sub">{stats}</div>}
      {casino.url && (
        <a href={casino.url} target="_blank" rel="nofollow noopener noreferrer sponsored" className="sg-cta mm-feat-cta">
          Hent bonus <Icon name="arrow-right" size={16} color="#fff" />
        </a>
      )}
      <div className="mm-feat-terms"><Terms html={casino.terms || DEFAULT_TERMS} /></div>
    </aside>
  )
}

export function MegaPanel({ item, today, onNavigate }: { item: NavItem; today: number; onNavigate: () => void }) {
  const groups = item.children.filter((c) => (c.children?.length ?? 0) > 0)
  const links = item.children.filter((c) => !(c.children?.length))
  const lower = item.label.toLowerCase()
  const seeAll = `Se alle ${/casino$/.test(lower) ? lower + 'er' : lower}`
  const footer = (
    <div className="mm-foot">
      <span>{item.panelNote ?? ''}</span>
      <Link href={item.href} onClick={onNavigate}>{seeAll} <Icon name="arrow-right" size={14} /></Link>
    </div>
  )

  // Several sub-groups (e.g. "Andet": payment methods + providers): one column each.
  if (groups.length >= 2) {
    return (
      <>
        <div className="mm-main">
          <div className="mm-cols">
            {groups.map((g) => <ChipGroup key={g.href + g.label} group={g} onNavigate={onNavigate} column />)}
            {links.length > 0 && (
              <div className="mm-col">
                <div className="mm-label">Læs mere</div>
                {links.map((l) => <LinkRow key={l.href + l.label} link={l} onNavigate={onNavigate} />)}
              </div>
            )}
          </div>
        </div>
        {item.panelNote && footer}
      </>
    )
  }

  const cols = item.featured ? 2 : links.length > 6 ? 3 : 2
  return (
    <>
      <div className={`mm-grid${item.featured ? '' : ' no-feat'}`}>
        <div className="mm-main">
          <div className="mm-label">{item.label}</div>
          <div className={`mm-links cols-${cols}`}>
            {links.map((l) => <LinkRow key={l.href + l.label} link={l} onNavigate={onNavigate} />)}
          </div>
          {groups.map((g) => isWeekdayGroup(g)
            ? <DaysGroup key={g.href + g.label} group={g} today={today} onNavigate={onNavigate} />
            : <ChipGroup key={g.href + g.label} group={g} onNavigate={onNavigate} />)}
        </div>
        {item.featured && <Featured casino={item.featured} label={item.featuredLabel} onNavigate={onNavigate} />}
      </div>
      {footer}
    </>
  )
}
