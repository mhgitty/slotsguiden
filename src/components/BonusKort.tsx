import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { CardFold } from '@/components/CardFold'
import { cardBodyComponents } from '@/components/cardBody'
import { replaceDateVars } from '@/lib/dateVars'

interface BonusKortData {
  customTitle?: string
  customBody?: any[]
  imageUrl?: string | null
  bonus?: {
    name: string
    bonusText: string
    logoUrl: string | null
    logoAlt: string | null
    score: number | null
    reviewSlug?: string
    slug?: string
    offerUrl: string
    terms: string | any[] | null
    minimumIndbetaling?: number | null
    gennemspilskrav?: string | null
    spinVaerdi?: string | null
    maksGevinst?: string | null
  }
}

// "0x", "0 x", "Ingen" → no wagering
const isZero = (v?: string | null) => !!v && /^(0\s*x?|ingen)$/i.test(v.trim())
const clean = (v?: string | null) => (v ?? '').trim().replace(/\.$/, '')

export function BonusKort({ value }: { value: BonusKortData }) {
  const b = value.bonus
  if (!b) return null

  const title = replaceDateVars(value.customTitle || b.bonusText || b.name)
  const chips: { k: string; v: string; good?: boolean }[] = []
  if (b.minimumIndbetaling != null) chips.push({ k: 'Min. indbetaling', v: `${b.minimumIndbetaling} kr.`, good: b.minimumIndbetaling === 0 })
  if (clean(b.gennemspilskrav)) chips.push({ k: 'Omsætningskrav', v: clean(b.gennemspilskrav), good: isZero(b.gennemspilskrav) })
  if (clean(b.spinVaerdi)) chips.push({ k: 'Spinværdi', v: clean(b.spinVaerdi) })
  if (clean(b.maksGevinst)) chips.push({ k: 'Maks. gevinst', v: clean(b.maksGevinst) === '∞' ? 'Ingen grænse' : clean(b.maksGevinst) })
  const hasBody = (value.customBody?.length ?? 0) > 0

  return (
    <article className="bk">
      <div className="bk-main">
        <div className="bk-top">
          {b.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={b.logoUrl} alt={b.logoAlt || b.name} width={48} height={48} loading="lazy" />
            : <span className="kc-logo-fallback">{b.name.slice(0, 2)}</span>}
          <div>
            {b.reviewSlug ? <Link href={`/online-casino/${b.reviewSlug}/`} className="bk-name">{b.name}</Link> : <span className="bk-name">{b.name}</span>}
            {b.score != null && <span className="kc-stars"><Icon name="star" size={13} color="var(--gold)" />{b.score.toFixed(1)}<span>/10</span></span>}
          </div>
        </div>
        <h3 className="bk-title">{title}</h3>
        {chips.length > 0 && (
          <div className="bk-chips">
            {chips.map((c) => <span key={c.k} className={`bk-chip${c.good ? ' is-good' : ''}`}>{c.k} <b>{c.v}</b></span>)}
          </div>
        )}
        {hasBody && (
          <CardFold>
            <PortableText value={value.customBody!} components={cardBodyComponents} />
          </CardFold>
        )}
      </div>
      <aside className="bk-side">
        {b.reviewSlug
          ? <Link className="sg-cta" href={`/online-casino/${b.reviewSlug}/`}>Gå til casino <Icon name="arrow-right" size={16} color="#fff" /></Link>
          : b.offerUrl && <a className="sg-cta" href={b.offerUrl} target="_blank" rel="nofollow noopener noreferrer sponsored">Gå til casino <Icon name="arrow-right" size={16} color="#fff" /></a>}
      </aside>
    </article>
  )
}
