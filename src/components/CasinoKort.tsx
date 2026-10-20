import { PortableText } from '@portabletext/react'
import { responsive } from '@/lib/img'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'
import { CardFold } from '@/components/CardFold'
import { cardBodyComponents, ptLength } from '@/components/cardBody'
import { replaceDateVars } from '@/lib/dateVars'

const DEFAULT_TERMS = '18+ | Regler og vilkår gælder | Spil ansvarligt | Selvudelukkelse via ROFUS | StopSpillet.dk'
const FOLD_AT = 480 // characters of body text before "Læs mere" kicks in

interface CasinoKortData {
  customTitle?: string
  customBody?: any[]
  rank?: number
  label?: string
  imageUrl?: string | null
  image?: { alt?: string }
  pros?: string[]
  cons?: string[]
  bookmaker?: {
    name: string
    slug?: string
    score: number | null
    logoUrl: string | null
    logoAlt: string | null
    url: string
    indbetalingsbonus?: string
    minIndbetaling?: number
    gennemspilskrav?: string
    terms?: string | any[]
  }
}

export function CasinoKort({ value }: { value: CasinoKortData }) {
  const bm = value.bookmaker
  if (!bm) return null

  const title = replaceDateVars(value.customTitle || bm.name)
  const reviewHref = bm.slug ? `/online-casino/${bm.slug}/` : null
  const hasPros = (value.pros?.length ?? 0) > 0
  const hasCons = (value.cons?.length ?? 0) > 0
  const hasBody = (value.customBody?.length ?? 0) > 0
  const isTop = value.rank === 1
  const stats = [
    bm.minIndbetaling != null ? { k: 'Min. indbetaling', v: `${bm.minIndbetaling} kr.` } : null,
    bm.gennemspilskrav ? { k: 'Omsætningskrav', v: bm.gennemspilskrav } : null,
  ].filter(Boolean) as { k: string; v: string }[]

  return (
    <article className={`kc${isTop ? ' is-top' : ''}`}>
      <div className="kc-head">
        <div className="kc-logo">
          {bm.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={bm.logoUrl} alt={bm.logoAlt || bm.name} width={64} height={64} loading="lazy" />
            : <span className="kc-logo-fallback">{bm.name.slice(0, 2)}</span>}
          {value.rank != null && <span className="kc-rank">{value.rank}</span>}
        </div>
        <div className="kc-id">
          {value.label && <span className="kc-tag"><Icon name="cup-star" size={13} />{replaceDateVars(value.label)}</span>}
          <h3 className="kc-title">{title}</h3>
          <div className="kc-sub">
            {bm.score != null && (
              <span className="kc-stars"><Icon name="star" size={14} color="var(--gold)" />{bm.score.toFixed(1)}<span>/10</span></span>
            )}
            {bm.score != null && reviewHref && <span aria-hidden="true">·</span>}
            {reviewHref && <Link href={reviewHref}>Læs anmeldelse</Link>}
          </div>
        </div>
        {bm.score != null && (
          <div className="kc-score" style={{ ['--s' as any]: Math.round(bm.score * 10) }} aria-hidden="true">
            <div><b>{bm.score.toFixed(1)}</b><small>SCORE</small></div>
          </div>
        )}
      </div>

      <div className={`kc-stats${stats.length ? '' : ' no-stats'}`}>
        <div className="kc-stat is-offer"><small>Velkomstbonus</small><b>{replaceDateVars(bm.indbetalingsbonus || 'Se tilbud')}</b></div>
        {stats.map((s) => <div key={s.k} className="kc-stat"><small>{s.k}</small><b>{s.v}</b></div>)}
        {bm.url && (
          <div className="kc-ctabox">
            <a className="sg-cta kc-cta" href={bm.url} target="_blank" rel="nofollow noopener noreferrer sponsored">
              Hent bonus <Icon name="arrow-right" size={16} color="#fff" />
            </a>
          </div>
        )}
      </div>

      {(hasBody || value.imageUrl) && (
        <div className={`kc-body${value.imageUrl ? '' : ' no-media'}`}>
          {hasBody && (
            <CardFold fold={ptLength(value.customBody) > FOLD_AT}>
              <PortableText value={value.customBody!} components={cardBodyComponents} />
            </CardFold>
          )}
          {value.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="kc-media" {...responsive(value.imageUrl, '(max-width: 760px) calc(100vw - 60px), 340px', [400, 700, 1000])} alt={value.image?.alt || `${bm.name} forside`} loading="lazy" decoding="async" />
          )}
        </div>
      )}

      {(hasPros || hasCons) && (
        <div className="kc-pc">
          {hasPros && (
            <div className="is-pros">
              <div className="kc-pc-h"><Icon name="check-circle" size={15} />Fordele</div>
              <ul>{value.pros!.map((p, i) => (
                <li key={i}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{p}</span></li>
              ))}</ul>
            </div>
          )}
          {hasCons && (
            <div className="is-cons">
              <div className="kc-pc-h"><Icon name="close-circle" size={15} />Ulemper</div>
              <ul>{value.cons!.map((c, i) => (
                <li key={i}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg><span>{c}</span></li>
              ))}</ul>
            </div>
          )}
        </div>
      )}

      <div className="kc-foot">
        <div className="kc-terms"><Terms html={bm.terms || DEFAULT_TERMS} /></div>
        {reviewHref && <Link className="kc-review" href={reviewHref}>Anmeldelse af {bm.name} <Icon name="arrow-right" size={14} /></Link>}
      </div>
    </article>
  )
}
