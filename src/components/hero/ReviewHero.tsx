import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'
import { replaceDateVars } from '@/lib/dateVars'
import { headingId } from '@/lib/headingId'

const DK_MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']

/** "20260301" → "marts 2026"; "2012" → "2012"; ISO date → "måned år"; else passthrough. */
export function formatLaunch(value?: string | null): string {
  if (!value) return ''
  const v = String(value).trim()
  if (/^\d{8}$/.test(v)) {
    const y = v.slice(0, 4), m = parseInt(v.slice(4, 6), 10)
    if (m >= 1 && m <= 12) return `${DK_MONTHS[m - 1]} ${y}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const [y, m] = v.split('-')
    const mi = parseInt(m, 10)
    if (mi >= 1 && mi <= 12) return `${DK_MONTHS[mi - 1]} ${y}`
  }
  return v
}

// "Hop til" chips: map the review's own h2s to short labels (first match wins, in page order)
const JUMPS: [RegExp, string][] = [
  [/bonus|velkomst/i, 'Bonus'],
  [/indbetal/i, 'Indbetaling'],
  [/udbetal/i, 'Udbetaling'],
  [/spiludbyder|spiludvikler|spiludvalg|casino ?spil|slots|spillemaskine/i, 'Spil & udbydere'],
  [/live/i, 'Live casino'],
  [/kundeservice|support/i, 'Kundeservice'],
  [/mobil|app\b/i, 'Mobil'],
  [/fordele|ulemper/i, 'Fordele & ulemper'],
  [/faq|ofte stillede|spørgsmål/i, 'FAQ'],
]
function jumpLinks(body?: any[]): { id: string; label: string }[] {
  if (!Array.isArray(body)) return []
  const out: { id: string; label: string }[] = []
  const used = new Set<string>()
  for (const b of body) {
    if (b?._type !== 'block' || b.style !== 'h2') continue
    const text = (b.children || []).map((c: any) => c.text || '').join('')
    const hit = JUMPS.find(([re, label]) => re.test(text) && !used.has(label))
    if (!hit) continue
    used.add(hit[1])
    out.push({ id: headingId(text), label: hit[1] })
    if (out.length >= 6) break
  }
  return out
}

// Hide campaigns that have ended, and bonuses switched off in Studio
const isLive = (b: any) => b?.active !== false && !(b?.kampagneSlut && new Date(b.kampagneSlut).getTime() < Date.now())

export function ReviewHero({ bm, bonuses }: { bm: any; bonuses: any[] }) {
  const logo = bm.logoSquare?.url ? bm.logoSquare : bm.logo?.url ? bm.logo : null
  const isSquare = !!bm.logoSquare?.url
  const launch = formatLaunch(bm.lanceringsdato)
  const license = !bm.license || /spillemyndighed/i.test(bm.license) ? 'Spillemyndigheden' : bm.license
  const jumps = jumpLinks(bm.body)
  const payments: any[] = bm.paymentMethods ?? []
  const software: any[] = bm.software ?? []
  const liveBonuses = bonuses.filter(isLive)
  const hasSide = payments.length > 0 || software.length > 0 || liveBonuses.length > 0 || !!launch

  return (
    <div className="mh-band">
      <div className="mh-wrap">
        <Breadcrumbs crumbs={[
          { label: 'Hjem', href: '/' },
          { label: 'Casinoanmeldelser', href: '/online-casino/' },
          { label: bm.name },
        ]} />

        <div className={`mh-grid${hasSide ? '' : ' no-side'}`}>
          <div className="mh-card">
            <div className="mh-pad">
              <div className="mh-head">
                {logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img className={`mh-logo${isSquare ? '' : ' is-wide'}`} src={logo.url} alt={logo.alt || bm.name} width={84} height={84} />
                  : <span className="mh-logotile"><span>{bm.name.slice(0, 2)}</span></span>}
                <div style={{ minWidth: 0 }}>
                  <div className="mh-chips">
                    <span className="mh-chip"><Icon name="shield-check" size={13} />Dansk licens</span>
                    <span className="mh-chip gold"><Icon name="verified-check" size={13} />Slotsguiden verificeret</span>
                  </div>
                  <h1 className="mh-h1">{replaceDateVars(bm.titel || `${bm.name} Anmeldelse`)}</h1>
                  <div className="mh-meta">
                    {bm.score != null && (
                      <span className="mh-star"><Icon name="star" size={14} color="var(--gold)" /><b>{bm.score.toFixed(1)}</b>/10</span>
                    )}
                    {bm.trustpilot && <span>Trustpilot <b>{bm.trustpilot}</b></span>}
                    {launch && <span>Lanceret <b>{launch}</b></span>}
                  </div>
                </div>
                {bm.score != null && (
                  <div className="mh-score" style={{ ['--s' as any]: Math.round(bm.score * 10) }} aria-label={`Slots-score ${bm.score.toFixed(1)} ud af 10`}>
                    <div><b>{bm.score.toFixed(1)}</b><small>SCORE</small></div>
                  </div>
                )}
              </div>

              <div className="mh-offer">
                <div className="is-big"><small>Velkomstbonus</small><b>{replaceDateVars(bm.indbetalingsbonus || 'Se aktuelle tilbud')}</b></div>
                {bm.minIndbetaling != null && <div><small>Min. indbetaling</small><b>{bm.minIndbetaling} kr.</b></div>}
                {bm.gennemspilskrav && <div><small>Omsætningskrav</small><b>{bm.gennemspilskrav}</b></div>}
                {bm.url && (
                  <div className="is-cta">
                    <a className="sg-cta" href={bm.url} target="_blank" rel="nofollow noopener noreferrer sponsored">
                      Gå til casino <Icon name="arrow-right" size={17} color="#fff" />
                    </a>
                  </div>
                )}
              </div>

              {jumps.length > 1 && (
                <nav className="mh-jump" aria-label="Hop til afsnit">
                  <span>Hop til</span>
                  {jumps.map((j) => <a key={j.id} href={`#${j.id}`}>{j.label}</a>)}
                </nav>
              )}
            </div>
            {bm.terms && <div className="mh-terms"><Terms html={bm.terms} /></div>}
          </div>

          {hasSide && (
            <aside className="mh-side">
              <div className="mh-panel">
                <div className="mh-panel-h">Hurtige fakta</div>
                <div className="mh-facts">
                  <div>Licens<b>{license}</b></div>
                  {launch && <div>Lanceret<b>{launch.charAt(0).toUpperCase() + launch.slice(1)}</b></div>}
                  {software.length > 0 && <div>Spiludviklere<b>{software.length}</b></div>}
                  {payments.length > 0 && <div>Betalingsmetoder<b>{payments.length}</b></div>}
                </div>
                {payments.length > 0 && (
                  <div className="mh-tags">
                    {payments.slice(0, 6).map((p) => (
                      <Link key={p._id} href={`/betalingsmetoder/${p.slug}/`}>{p.name}</Link>
                    ))}
                    {payments.length > 6 && <span>+{payments.length - 6}</span>}
                  </div>
                )}
                {software.length > 0 && (
                  <>
                    <div className="mh-sub">Spiludviklere</div>
                    <div className="mh-tags">
                      {software.slice(0, 6).map((s) => (
                        <Link key={s._id} href={`/spiludviklere/${s.slug}/`}>{s.name}</Link>
                      ))}
                      {software.length > 6 && <span>+{software.length - 6}</span>}
                    </div>
                  </>
                )}
                {liveBonuses.length > 0 && (
                  <>
                    <div className="mh-sub">Aktive bonusser</div>
                    {liveBonuses.slice(0, 3).map((b) => {
                      const href = b.slug ? `/casino-kampagner/${b.slug}/` : (b.offerUrl || '#')
                      return (
                        <Link key={b._id} href={href} className="mh-bonuslink">
                          {replaceDateVars(b.label || b.title)}
                          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </Link>
                      )
                    })}
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
