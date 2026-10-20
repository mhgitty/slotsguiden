import Link from 'next/link'
import { getPosts, getLatestCampaigns } from '@/lib/sanity'
import { Icon } from '@/components/Icon'
import { responsive, sized } from '@/lib/img'

const FREE_SPINS_URL = '/free-spins-til-eksisterende-kunder/'
const INDBETALINGSBONUS_URL = '/casino-bonus/indbetalingsbonus/'
const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.']

function when(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'I dag'
  if (days === 1) return 'I går'
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : ''}`
}

const postHref = (p: any) => `/${p.slug?.current ?? ''}/`

/** Branded stand-in when a post has no featured image */
function Fallback({ label }: { label?: string }) {
  return (
    <span className="lc-fallback" aria-hidden="true">
      <span className="lc-fb-mark"><span>slots</span><b>guiden</b></span>
      {label && <span className="lc-fb-cat">{label}</span>}
    </span>
  )
}

/** "Nyt på Slotsguiden": latest news and live campaigns, shown above the footer. */
export async function LatestContentBlock() {
  const [posts, campaigns] = await Promise.all([
    getPosts(3).catch(() => []),
    getLatestCampaigns(6).catch(() => []),
  ])
  const list: any[] = Array.isArray(posts) ? posts : []
  const camps: any[] = Array.isArray(campaigns) ? campaigns : []
  if (!list.length && !camps.length) return null
  const [lead, ...rest] = list

  return (
    <section className="lc" aria-labelledby="lc-title">
      <h2 id="lc-title" className="lc-title">Nyt på Slotsguiden</h2>
      <div className={`lc-grid${list.length && camps.length ? '' : ' one'}`}>
        {lead && (
          <div className="lc-col">
            <div className="lc-h">
              <span><Icon name="pen-new-square" size={18} />Seneste nyheder</span>
              <Link href="/blog/">Alle nyheder <Icon name="alt-arrow-right" size={14} /></Link>
            </div>
            <Link href={postHref(lead)} className="lc-lead">
              <span className="lc-media">
                {lead.featuredImage?.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img {...responsive(lead.featuredImage.url, '(max-width: 900px) 100vw, 600px', [480, 760, 1200])} alt={lead.featuredImage.alt || lead.title || ''} width={1200} height={628} loading="lazy" decoding="async" />
                  : <Fallback label={lead.category?.name} />}
              </span>
              <span className="lc-lead-body">
                <span className="lc-meta">{lead.category?.name && <b>{lead.category.name}</b>}{when(lead.publishedAt)}</span>
                <span className="lc-lead-t">{lead.title}</span>
                {lead.excerpt && <span className="lc-ex">{lead.excerpt.length > 150 ? lead.excerpt.slice(0, 150).trimEnd() + '…' : lead.excerpt}</span>}
              </span>
            </Link>
            {rest.map((p) => (
              <Link key={p._id} href={postHref(p)} className="lc-row">
                <span className="lc-thumb">
                  {p.featuredImage?.url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={sized(p.featuredImage.url, 240)} alt="" width={120} height={80} loading="lazy" decoding="async" />
                    : <Fallback />}
                </span>
                <span className="lc-row-t"><b>{p.title}</b><small>{when(p.publishedAt)}</small></span>
              </Link>
            ))}
          </div>
        )}

        {camps.length > 0 && (
          <div className="lc-col">
            <div className="lc-h">
              <span><Icon name="gift" size={18} />Nyeste kampagner</span>
              <Link href="/casino-kampagner/">Alle kampagner <Icon name="alt-arrow-right" size={14} /></Link>
            </div>
            <ul className="lc-camps">
              {camps.map((b) => (
                <li key={b._id}>
                  <Link href={b.slug ? `/casino-kampagner/${b.slug}/` : (b.offerUrl || '#')} className="lc-camp">
                    {b.logo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={b.logo} alt="" width={40} height={40} loading="lazy" />
                      : <span className="lc-camp-ph">{(b.casino || b.title || '?').slice(0, 1)}</span>}
                    <span className="lc-camp-t"><b>{b.title}</b><small>{when(b.date)}</small></span>
                    <Icon name="alt-arrow-right" size={16} className="lc-go" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="lc-btns">
              <Link href={FREE_SPINS_URL} className="sg-cta">Se alle free spins</Link>
              <Link href={INDBETALINGSBONUS_URL} className="sg-btn-ghost">Indbetalingsbonusser</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
