import Link from 'next/link'
import { slotName, volDa, VOL_LEVEL } from './slotUtils'

export interface SlotCardData {
  _id: string
  name: string
  slug: string
  img?: string | null
  hasDemo?: boolean
  rtp?: string | null
  volatility?: string | null
  provider?: { name?: string; slug?: string } | null
  date?: string
}


const Play = ({ s = 12 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.76-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" />
  </svg>
)

/** One slot in a grid: art, demo badge, name, provider, RTP and volatility. */
export function SlotCard({ g, showProvider = true }: { g: SlotCardData; showProvider?: boolean }) {
  const name = slotName(g.name)
  const lvl = g.volatility ? VOL_LEVEL[g.volatility] || 0 : 0
  const vol = volDa(g.volatility)
  return (
    <Link href={`/online-spillemaskiner/${g.slug}/`} className="sc">
      <span className="sc-media">
        {g.img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={g.img} alt={name} width={480} height={360} loading="lazy" decoding="async" />
          : <span className="sc-ph">{name.slice(0, 1)}</span>}
        {g.hasDemo && <span className="sc-demo"><Play s={9} />Demo</span>}
        <span className="sc-hover"><span><Play s={13} />{g.hasDemo ? 'Spil gratis' : 'Læs anmeldelse'}</span></span>
      </span>
      <span className="sc-body">
        <b className="sc-name">{name}</b>
        {showProvider && g.provider?.name && <span className="sc-prov">{g.provider.name}</span>}
        {(g.rtp || lvl > 0) && (
          <span className="sc-meta">
            {g.rtp && <span>RTP <b>{g.rtp}</b></span>}
            {lvl > 0 && (
              <span className="sc-vol" title={`Volatilitet: ${vol}`}>
                <i className="sc-bars" data-l={lvl}><i /><i /><i /></i>{vol}
              </span>
            )}
          </span>
        )}
      </span>
    </Link>
  )
}
