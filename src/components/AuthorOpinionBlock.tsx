import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { getAuthorById, getSiteSettings } from '@/lib/sanity'
import { replaceDateVars, replaceDateVarsInBlocks } from '@/lib/dateVars'
import { headingId } from '@/lib/headingId'

interface Props {
  value: {
    title?: string
    level?: 'h2' | 'h3'
    author?: { _ref?: string }
    body?: any[]
  }
}

// Links to our own site become relative, so they stay on the current domain.
const internal = (href?: string) => {
  if (!href) return null
  const m = href.match(/^https?:\/\/(?:www\.)?slotsguiden\.dk(\/.*)?$/i)
  return m ? m[1] || '/' : href.startsWith('/') ? href : null
}

const components = {
  block: {
    normal: ({ children }: any) => <p>{children}</p>,
  },
  marks: {
    strong: ({ children }: any) => <strong>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ value, children }: any) => {
      const local = internal(value?.href)
      if (local && !value?.blank) return <Link href={local}>{children}</Link>
      const rel = ['noopener', 'noreferrer', value?.nofollow ? 'nofollow' : ''].filter(Boolean).join(' ')
      return <a href={value?.href} target={value?.blank ? '_blank' : undefined} rel={rel}>{children}</a>
    },
  },
}

/**
 * "Eksperten mener" — the reviewer's personal verdict on a casino.
 * Uses the block's author, falling back to the default author from Site Settings.
 */
export async function AuthorOpinionBlock({ value }: Props) {
  if (!value?.body?.length) return null

  let person: { name?: string; role?: string; slug?: { current?: string }; imageUrl?: string } | null = null
  try {
    person = value.author?._ref
      ? await getAuthorById(value.author._ref)
      : ((await getSiteSettings())?.defaultAuthor ?? null)
  } catch {
    person = null
  }

  const name = person?.name || 'Slotsguiden.dk'
  const href = person?.slug?.current ? `/redaktion/${person.slug.current}/` : null
  const initial = name.trim().charAt(0).toUpperCase()
  const title = value.title ? replaceDateVars(value.title) : ''
  const H = value.level === 'h2' ? 'h2' : 'h3'

  return (
    <aside className="op" aria-label={title || `${name}s vurdering`}>
      <span className="op-mark" aria-hidden="true">”</span>

      <div className="op-head">
        <span className="op-avatar">
          {person?.imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={person.imageUrl} alt={name} loading="lazy" width={64} height={64} />
            : <span className="op-avatar-initial">{initial}</span>}
          <span className="op-badge" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="10" height="10"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </span>
        <div className="op-who">
          <span className="op-kicker">Eksperten mener</span>
          {href ? <Link href={href} className="op-name">{name}</Link> : <span className="op-name">{name}</span>}
          {person?.role && <span className="op-role">{person.role}</span>}
        </div>
      </div>

      {title && <H id={headingId(title)} className="op-title">{title}</H>}

      <div className="op-body">
        <PortableText value={replaceDateVarsInBlocks(value.body)} components={components} />
      </div>

      <div className="op-sign">
        <span className="op-sign-line" aria-hidden="true" />
        <span className="op-sign-name">{name}</span>
        {href && <Link href={href} className="op-sign-link">Se profil →</Link>}
      </div>
    </aside>
  )
}
