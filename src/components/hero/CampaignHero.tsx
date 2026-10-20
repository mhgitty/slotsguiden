import Link from 'next/link'
import { responsive } from '@/lib/img'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'

const DK_MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']
const fmt = (d: Date) => `${d.getDate()}. ${DK_MONTHS[d.getMonth()]} ${d.getFullYear()}`
const valid = (v?: string | null) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d }

function period(start?: string | null, end?: string | null): string | null {
  const s = valid(start), e = valid(end)
  if (s && e) {
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) return `${s.getDate()}.–${fmt(e)}`
    return `${fmt(s)} – ${fmt(e)}`
  }
  if (e) return `Gælder til ${fmt(e)}`
  return null
}

const AUDIENCE: Record<string, string> = {
  'existing customers': 'For eksisterende kunder',
  'new customers': 'For nye kunder',
}

const isZero = (v?: string | null) => !!v && /^(0\s*x?|ingen)$/i.test(v.trim())
const clean = (v?: string | null) => (v ?? '').trim().replace(/\.$/, '')

export function CampaignHero({ b, title, casinoName, logo }: { b: any; title: string; casinoName: string; logo?: { url?: string; alt?: string } | null }) {
  const end = valid(b.kampagneSlut)
  const expired = !!end && end.getTime() < Date.now()
  const when = period(b.kampagneStart, b.kampagneSlut)
  const audience = b.schemaAudience ? (AUDIENCE[String(b.schemaAudience).toLowerCase()] || b.schemaAudience) : null
  const reviewHref = b.bookmaker?.slug ? `/online-casino/${b.bookmaker.slug}/` : null
  const img = b.kampagneBillede?.url ? b.kampagneBillede : null

  const chips: { k: string; v: string; good?: boolean }[] = []
  if (b.minimumIndbetaling != null) chips.push({ k: 'Min. indbetaling', v: `${b.minimumIndbetaling} kr.`, good: b.minimumIndbetaling === 0 })
  if (clean(b.gennemspilskrav)) chips.push({ k: 'Omsætningskrav', v: clean(b.gennemspilskrav), good: isZero(b.gennemspilskrav) })
  if (clean(b.spinVaerdi)) chips.push({ k: 'Spinværdi', v: clean(b.spinVaerdi) })
  if (clean(b.maksGevinst)) chips.push({ k: 'Maks. gevinst', v: clean(b.maksGevinst) === '∞' ? 'Ingen grænse' : clean(b.maksGevinst) })
  if (clean(b.minimumOdds)) chips.push({ k: 'Min. odds', v: clean(b.minimumOdds) })
  if (clean(b.bonuskode)) chips.push({ k: 'Bonuskode', v: clean(b.bonuskode) })

  return (
    <div className="mh-band">
      <div className="mh-wrap">
        <Breadcrumbs crumbs={[
          { label: 'Hjem', href: '/' },
          { label: 'Casino kampagner', href: '/casino-kampagner/' },
          { label: casinoName || title },
        ]} />
        <div className="mh-card">
          <div className="mh-pad">
            <div className={`mh-bonus${img ? '' : ' no-img'}${expired ? ' is-expired' : ''}`}>
              {img && (
                <div className="mh-banner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img {...responsive(img.url, '(max-width: 760px) calc(100vw - 50px), 520px', [500, 800, 1100])} alt={img.alt || title} width={img.w || undefined} height={img.h || undefined} fetchPriority="high" />
                  {expired && end
                    ? <span className="mh-chip red">Udløbet {fmt(end)}</span>
                    : audience ? <span className="mh-chip">{audience}</span> : null}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                {(casinoName || logo?.url) && (
                  <div className="mh-casino">
                    {logo?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo.url} alt={logo.alt || casinoName} width={40} height={40} />
                    )}
                    {casinoName && <span className="n">{casinoName}</span>}
                    {b.bookmaker?.score != null && (
                      <span className="mh-stars"><Icon name="star" size={13} color="var(--gold)" />{b.bookmaker.score.toFixed(1)}</span>
                    )}
                    {reviewHref && <Link href={reviewHref} className="rv">Læs anmeldelse</Link>}
                  </div>
                )}
                <h1 className="mh-h1" style={{ marginTop: '10px' }}>{title}</h1>
                {chips.length > 0 && (
                  <div className="mh-bchips">
                    {chips.map((c) => <span key={c.k} className={`mh-bchip${c.good ? ' is-good' : ''}`}>{c.k} <b>{c.v}</b></span>)}
                  </div>
                )}
                {(when || audience) && (
                  <div className="mh-status">
                    {when && <span><Icon name="calendar" size={15} color="var(--green)" />{when}</span>}
                    {audience && <span><Icon name="user" size={15} color="var(--green)" />{audience}</span>}
                  </div>
                )}
                {expired && end && (
                  <div className="mh-expired" role="status">
                    Kampagnen sluttede {fmt(end)}.{casinoName ? ` Se ${casinoName}s aktuelle tilbud, eller find andre kampagner.` : ' Find andre aktuelle kampagner.'}
                  </div>
                )}
                <div className="mh-bcta">
                  {expired ? (
                    <>
                      {reviewHref && (
                        <Link className="sg-cta" href={reviewHref}>
                          Se {casinoName ? `${casinoName}s` : 'casinoets'} aktuelle tilbud <Icon name="arrow-right" size={16} color="#fff" />
                        </Link>
                      )}
                      <Link className="mh-ghost" href="/casino-kampagner/">Andre kampagner</Link>
                    </>
                  ) : b.offerUrl ? (
                    <a className="sg-cta" href={b.offerUrl} target="_blank" rel="nofollow sponsored noopener">
                      Hent bonus <Icon name="arrow-right" size={16} color="#fff" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          {b.terms && <div className="mh-terms"><Terms html={b.terms} /></div>}
        </div>
      </div>
    </div>
  )
}
