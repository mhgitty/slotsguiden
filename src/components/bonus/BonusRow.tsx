import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'
import { sized } from '@/lib/img'
import { replaceDateVars } from '@/lib/dateVars'
import type { MatchedSlot } from '@/lib/slotMatch'

const DEFAULT_TERMS =
  'Alle bonusser og kampagner er underlagt vilkår, herunder gennemspilskrav, berettigelsesbegrænsninger og udløbsdatoer. Læs de fuldstændige vilkår på casinoets hjemmeside, før du gør krav på dem. 18+ | Spil ansvarligt.'

// "0x", "0 x", "Ingen" → no wagering
const isZero = (v?: string | null) => !!v && /^(0\s*x?|ingen)$/i.test(v.trim())
const clean = (v?: string | null) => (v ?? '').trim().replace(/\.$/, '')
const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.']
const dayMonth = (d: Date) => `${d.getDate()}. ${MONTHS[d.getMonth()]}`

/** Offer title with the game name turned into a link to its slot page. */
function OfferTitle({ text, slot }: { text: string; slot?: MatchedSlot | null }) {
  if (!slot) return <>{text}</>
  const i = text.toLowerCase().indexOf(slot.name.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <Link href={`/online-spillemaskiner/${slot.slug}/`}>{text.slice(i, i + slot.name.length)}</Link>
      {text.slice(i + slot.name.length)}
    </>
  )
}

/** One campaign in a ranked list: casino, offer and game, key numbers, one button, terms underneath. */
export function BonusRow({ b, rank, slot }: { b: any; rank?: number; slot?: MatchedSlot | null }) {
  const offer = replaceDateVars(b.oddsBonusTitel || b.title || '')
  const name = b.casinoNavn || b.bookmaker?.name || ''
  const logo = b.casinoLogoSquare?.url || b.bookmaker?.logoSquare?.url || b.casinoLogo?.url || b.bookmaker?.logo?.url
  const score: number | undefined = b.bookmaker?.score
  const reviewSlug = b.bookmaker?.slug?.current
  const pageSlug = b.slug?.current || (typeof b.slug === 'string' ? b.slug : null)
  const end = b.kampagneSlut ? new Date(b.kampagneSlut) : null
  const endsSoon = end && end.getTime() - Date.now() < 3 * 86400000

  const chips: { k: string; v: string; good?: boolean; warn?: boolean }[] = []
  if (b.minimumIndbetaling != null) chips.push({ k: 'Min. indbetaling', v: `${b.minimumIndbetaling} kr.`, good: b.minimumIndbetaling === 0 })
  if (clean(b.gennemspilskrav)) chips.push({ k: 'Omsætningskrav', v: clean(b.gennemspilskrav), good: isZero(b.gennemspilskrav) })
  if (clean(b.spinVaerdi)) chips.push({ k: 'Spinværdi', v: clean(b.spinVaerdi) })
  if (clean(b.maksGevinst)) chips.push({ k: 'Maks. gevinst', v: clean(b.maksGevinst) === '∞' ? 'Ingen grænse' : clean(b.maksGevinst) })
  if (b.minimumOdds) chips.push({ k: 'Min. odds', v: String(b.minimumOdds) })
  if (end) chips.push({ k: 'Slutter', v: dayMonth(end), warn: !!endsSoon })

  return (
    <article className={`br${rank === 1 ? ' is-top' : ''}`}>
      {rank != null && <span className="br-rank" aria-label={`Nr. ${rank}`}>{rank}</span>}
      <div className="br-grid">
        <div className="br-casino">
          {logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logo} alt={name} width={56} height={56} loading="lazy" />
            : <span className="br-logo-ph">{name.slice(0, 2)}</span>}
          <div className="br-id">
            {reviewSlug ? <Link href={`/online-casino/${reviewSlug}/`} className="br-name">{name}</Link> : <span className="br-name">{name}</span>}
            {score != null && <span className="kc-stars"><Icon name="star" size={13} color="var(--gold)" />{score.toFixed(1)}<span>/10</span></span>}
          </div>
        </div>

        <div className={`br-offer${slot?.img ? '' : ' no-game'}`}>
          {slot?.img && (
            <Link href={`/online-spillemaskiner/${slot.slug}/`} className="br-game" title={`${slot.name}${slot.hasDemo ? ' – prøv gratis demo' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sized(slot.img, 200)} alt={slot.name} width={96} height={72} loading="lazy" />
              {slot.hasDemo && <span><Icon name="play" size={10} />Demo</span>}
            </Link>
          )}
          <h3 className="br-title"><OfferTitle text={offer} slot={slot} /></h3>
          {chips.length > 0 && (
            <div className="bk-chips">
              {chips.map((c) => <span key={c.k} className={`bk-chip${c.good ? ' is-good' : ''}${c.warn ? ' is-warn' : ''}`}>{c.k} <b>{c.v}</b></span>)}
            </div>
          )}
        </div>

        <div className="br-cta">
          {b.offerUrl && (
            <a className="sg-cta" href={b.offerUrl} target="_blank" rel="nofollow noopener noreferrer sponsored">
              Hent bonus <Icon name="arrow-right" size={16} color="#fff" />
            </a>
          )}
          {pageSlug && <Link className="kc-review" href={`/casino-kampagner/${pageSlug}/`}>Læs om kampagnen <Icon name="arrow-right" size={14} /></Link>}
        </div>
      </div>
      <div className="br-terms"><Terms html={b.terms || DEFAULT_TERMS} /></div>
    </article>
  )
}
