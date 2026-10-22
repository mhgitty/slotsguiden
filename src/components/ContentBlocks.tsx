import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { replaceDateVars } from '@/lib/dateVars'
import { headingId } from '@/lib/headingId'

// Visual body blocks: stats strip, timeline, step cards, feature cards,
// team cards and contact card. Same block types and fields as Pokcas, styled
// for Slotsguiden. Plain server components, no client JS.
// Step and card titles are real <h3> headings, so pages keep their heading
// structure when plain text sections are turned into cards.

const t = (s?: string) => replaceDateVars(s || '')

// Card text: rich text with links when given (Slotsguiden extra), else plain text
const LINK_HOST = /^https?:\/\/(www\.)?slotsguiden\.dk/i
const richComponents = {
  block: { normal: ({ children }: any) => <p>{children}</p> },
  marks: {
    link: ({ value, children }: any) => {
      const href = String(value?.href || '').replace(LINK_HOST, '') || '/'
      return href.startsWith('/') ? <Link href={href}>{children}</Link> : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    },
  },
}
const hasLinks = (body?: any[]) => (body || []).some((b) => (b?.markDefs || []).some((m: any) => m?._type === 'link'))
function CardText({ item, className }: { item: any; className: string }) {
  if (item.body?.length) return <div className={`${className} cb-rich`}><PortableText value={item.body} components={richComponents as any} /></div>
  if (!item.text) return null
  const paras = t(item.text).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)
  if (paras.length === 1) return <p className={className}>{paras[0]}</p>
  return <div className={`${className} cb-rich`}>{paras.map((x, n) => <p key={n}>{x}</p>)}</div>
}

function BlockHead({ title, intro }: { title?: string; intro?: string }) {
  if (!title && !intro) return null
  return (
    <div className="cb-head">
      {title && <h3 className="cb-title" id={headingId(t(title))}>{t(title)}</h3>}
      {intro && <p className="cb-intro">{t(intro)}</p>}
    </div>
  )
}

// ── Stats strip ──────────────────────────────────────────────────────────────
export function StatsBlock({ value }: { value: any }) {
  const items = (value?.items || []).filter((i: any) => i?.value)
  if (!items.length) return null
  return (
    <div className="cb-wrap">
      <BlockHead title={value.title} />
      <div className="cb-stats">
        {items.map((i: any) => (
          <div key={i._key} className="cb-stat">
            <div className="cb-stat-value">{t(i.value)}</div>
            <div className="cb-stat-label">{t(i.label)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Timeline ─────────────────────────────────────────────────────────────────
export function TimelineBlock({ value }: { value: any }) {
  const items = (value?.items || []).filter((i: any) => i?.title)
  if (!items.length) return null
  return (
    <div className="cb-wrap">
      <BlockHead title={value.title} />
      <ol className="cb-timeline">
        {items.map((i: any) => (
          <li key={i._key} className="cb-tl-item">
            <span className="cb-tl-dot" aria-hidden />
            <div className="cb-tl-card">
              {i.label && <span className="cb-tl-label">{t(i.label)}</span>}
              <div className="cb-tl-title">{t(i.title)}</div>
              {i.text && <p className="cb-tl-text">{t(i.text)}</p>}
              {i.href && i.linkLabel && <Link href={i.href} className="cb-tl-link">{t(i.linkLabel)} →</Link>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Numbered step cards ──────────────────────────────────────────────────────
export function StepCardsBlock({ value }: { value: any }) {
  const items = (value?.items || []).filter((i: any) => i?.title)
  if (!items.length) return null
  const cols = [1, 2, 3].includes(value.columns) ? value.columns : 2
  return (
    <div className="cb-wrap">
      <BlockHead title={value.title} intro={value.intro} />
      <ol className="cb-steps" data-cols={cols}>
        {items.map((i: any, n: number) => (
          <li key={i._key} className="cb-step">
            <span className="cb-step-num">{n + 1}</span>
            <div>
              <h3 className="cb-step-title">{t(i.title)}</h3>
              <CardText item={i} className="cb-step-text" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Icon feature cards ───────────────────────────────────────────────────────
export function FeatureCardsBlock({ value }: { value: any }) {
  const items = (value?.items || []).filter((i: any) => i?.title)
  if (!items.length) return null
  const cols = [2, 3, 4].includes(value.columns) ? value.columns : 3
  return (
    <div className="cb-wrap">
      <BlockHead title={value.title} intro={value.intro} />
      <div className="cb-features" data-cols={cols}>
        {items.map((i: any) => {
          const linkCard = !!i.href && !hasLinks(i.body) // no links inside a link
          const inner = (
            <>
              {i.icon && <span className="cb-feature-icon" aria-hidden>{i.icon}</span>}
              {i.eyebrow && <span className="cb-feature-eyebrow">{t(i.eyebrow)}</span>}
              <h3 className="cb-feature-title">{t(i.title)}</h3>
              <CardText item={i} className="cb-feature-text" />
              {linkCard && <span className="cb-feature-go">Læs mere →</span>}
            </>
          )
          return linkCard
            ? <Link key={i._key} href={i.href} className="cb-feature cb-feature--link">{inner}</Link>
            : <div key={i._key} className="cb-feature">{inner}</div>
        })}
      </div>
    </div>
  )
}

// ── Team cards ───────────────────────────────────────────────────────────────
// Expects members[].author to be dereferenced (name, role, slug, imageUrl).
export function TeamBlock({ value }: { value: any }) {
  const members = (value?.members || []).filter((m: any) => m?.author?.name)
  if (!members.length) return null
  return (
    <div className="cb-wrap">
      <BlockHead title={value.title} />
      <div className="cb-team" data-count={members.length}>
        {members.map((m: any) => {
          const a = m.author
          const role = m.role || a.role
          const href = a.slug ? `/redaktion/${a.slug}/` : null
          const card = (
            <>
              {a.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="cb-member-photo" src={`${a.imageUrl}?w=200&h=200&fit=crop&fm=webp`} alt={a.name} width={84} height={84} loading="lazy" />
                : <span className="cb-member-photo cb-member-initial">{a.name.charAt(0)}</span>}
              <div style={{ minWidth: 0 }}>
                <div className="cb-member-name">{a.name}</div>
                {role && <div className="cb-member-role">{t(role)}</div>}
                {m.blurb && <p className="cb-member-blurb">{t(m.blurb)}</p>}
                {href && <span className="cb-member-link">Se profil →</span>}
              </div>
            </>
          )
          return href
            ? <Link key={m._key} href={href} className="cb-member">{card}</Link>
            : <div key={m._key} className="cb-member">{card}</div>
        })}
      </div>
    </div>
  )
}

// ── Contact card ─────────────────────────────────────────────────────────────
export function ContactCardBlock({ value }: { value: any }) {
  if (!value?.title && !value?.email && !(value?.links || []).length) return null
  const links = (value.links || []).filter((l: any) => l?.url && l?.label)
  return (
    <div className="cb-wrap">
      <div className="cb-contact">
        <div className="cb-contact-inner">
          {value.title && <div className="cb-contact-title">{t(value.title)}</div>}
          {value.text && <p className="cb-contact-text">{t(value.text)}</p>}
          {value.email && (
            <a className="cb-contact-email" href={`mailto:${value.email}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
              {value.email}
            </a>
          )}
          {links.length > 0 && (
            <div className="cb-contact-links">
              {links.map((l: any) => (
                <a key={l._key} className="cb-contact-link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
