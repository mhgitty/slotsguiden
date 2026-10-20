import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { MobileToc } from '@/components/MobileToc'
import { TableOfContents } from '@/components/TableOfContents'
import { JsonLd } from '@/components/JsonLd'
import { Icon } from '@/components/Icon'
import { Terms } from '@/components/Terms'
import { SlotDemo } from '@/components/slot/SlotDemo'
import { SlotPicker, type PickerCasino } from '@/components/slot/SlotPicker'
import { slotName, pickCasinos, offerOf, minDeposit } from '@/components/slot/slotUtils'
import { getSpillemaskineBySlug, client } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 3600
const BASE = 'https://slotsguiden.dk'

export async function generateStaticParams() {
  const items = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "spillemaskine" && defined(slug.current)]{ "slug": slug.current }`
  ).catch(() => [])
  return items.map((s) => ({ slug: s.slug }))
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const g: any = await getSpillemaskineBySlug(slug).catch(() => null)
  if (!g) return {}
  const title = replaceDateVars(g.metaTitle || g.titel || g.name)
  const description = replaceDateVars(g.metaDescription || blocksToPlainText(g.intro) || blocksToPlainText(g.body))
  const canonical = `${BASE}/online-spillemaskiner/${slug}/`
  const img = g.ogImage?.url || g.featuredImage?.url
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', images: img ? [{ url: img }] : [{ url: `${BASE}/og.png` }] },
  }
}

const SPECS: { key: string; label: string; icon: string }[] = [
  { key: 'provider', label: 'Udvikler', icon: 'gamepad' },
  { key: 'rtp', label: 'RTP', icon: 'pie-chart-2' },
  { key: 'volatilitet', label: 'Volatilitet', icon: 'graph-up' },
  { key: 'maksGevinst', label: 'Maks. gevinst', icon: 'cup-star' },
  { key: 'layout', label: 'Hjul / rækker', icon: 'widget' },
  { key: 'gevinstsystem', label: 'Gevinstsystem', icon: 'layers' },
  { key: 'indsats', label: 'Indsats', icon: 'wallet-money' },
  { key: 'udgivet', label: 'Udgivet', icon: 'calendar' },
]

function SlotSpecs({ g, id }: { g: any; id?: string }) {
  const tiles = SPECS
    .map((s) => ({ ...s, value: s.key === 'provider' ? g.provider?.name : g[s.key] }))
    .filter((s) => s.value)
  if (!tiles.length && !g.funktioner) return null
  return (
    <div className="sl-specs-wrap" id={id}>
      {tiles.length > 0 && (
        <div className="sl-specs">
          {tiles.map((s) => (
            <div className="sl-spec" key={s.key}>
              <Icon name={s.icon} size={20} />
              <small>{s.label}</small>
              <b>{s.key === 'provider' && g.provider?.slug
                ? <Link href={`/spiludviklere/${g.provider.slug}/`}>{s.value}</Link>
                : s.value}</b>
            </div>
          ))}
        </div>
      )}
      {g.funktioner && (
        <div className="sl-spec sl-spec-wide">
          <Icon name="stars" size={20} />
          <small>Bonusfunktioner</small>
          <b>{g.funktioner}</b>
        </div>
      )}
    </div>
  )
}

/** "Op til 5.000x indsatsen (…)" → "5.000x" */
function maxChip(v?: string): string | null {
  const m = v?.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?)\s*x\b/i)
  return m ? `${m[1].replace(/\s/g, '.')}x` : null
}
/** "6 hjul / 5 rækker" → "6×5" */
function gridChip(v?: string): string | null {
  if (!v) return null
  const m = v.match(/(\d+)\s*(?:hjul)?\s*(?:[x×/,]|og)\s*(?:op til\s*)?(\d+)/i)
  return m ? `${m[1]}×${m[2]}` : null
}

export default async function SpillemaskinePage({ params }: Props) {
  const { slug } = await params
  const g: any = await getSpillemaskineBySlug(slug).catch(() => null)
  if (!g) notFound()

  const name = slotName(g.name)
  const canonical = `${BASE}/online-spillemaskiner/${slug}/`
  const body: any[] = g.body || []
  const specsAt = body.findIndex((b) => b?._type === 'slotSpecsBlock')
  const hasSpecs = !!(g.provider?.name || SPECS.some((x) => g[x.key]) || g.funktioner)
  const poster = g.featuredImage?.url || null
  const thumb = g.featuredImage?.thumb || null
  const providerHref = g.provider?.slug ? `/spiludviklere/${g.provider.slug}/` : null

  const casinos: PickerCasino[] = pickCasinos(g).map((c) => ({
    id: c._id,
    name: c.name,
    score: c.score,
    url: c.url!,
    offer: offerOf(c),
    min: minDeposit(c),
    wager: c.gennemspilskrav && c.gennemspilskrav.trim() !== '-' ? c.gennemspilskrav : null,
    logoUrl: c.logoUrl,
    terms: c.terms ? <Terms html={c.terms} /> : null,
  }))

  const chips = [
    g.rtp && { icon: 'pie-chart-2', label: 'RTP', value: g.rtp },
    g.volatilitet && { icon: 'graph-up', label: 'Volatilitet', value: g.volatilitet },
    maxChip(g.maksGevinst) && { icon: 'cup-star', label: 'Maks.', value: maxChip(g.maksGevinst)!, hot: true },
    gridChip(g.layout) && { icon: 'widget', label: '', value: gridChip(g.layout)! },
  ].filter(Boolean) as { icon: string; label: string; value: string; hot?: boolean }[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Online spillemaskiner', item: `${BASE}/online-spillemaskiner/` },
          { '@type': 'ListItem', position: 3, name, item: canonical },
        ],
      },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: replaceDateVars(g.titel || g.name), inLanguage: 'da-DK', publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE } },
      {
        '@type': 'VideoGame',
        '@id': `${canonical}#game`,
        name,
        url: canonical,
        ...(poster ? { image: poster } : {}),
        ...(g.provider?.name ? { author: { '@type': 'Organization', name: g.provider.name }, publisher: { '@type': 'Organization', name: g.provider.name } } : {}),
        applicationCategory: 'Game',
        genre: 'Spillemaskine',
        gamePlatform: ['Web', 'Mobil'],
        operatingSystem: 'HTML5',
        inLanguage: 'da',
        ...(g.demoUrl ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'DKK', availability: 'https://schema.org/InStock', description: 'Gratis demo' } } : {}),
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      <section className="sl-stage">
        <div className="sl-wrap">
          <div className="sl-crumbs">
            <Breadcrumbs crumbs={[
              { label: 'Hjem', href: '/' },
              { label: 'Online spillemaskiner', href: '/online-spillemaskiner/' },
              { label: name },
            ]} />
          </div>

          <div className="sl-head">
            {thumb && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img className="sl-thumb" src={thumb} alt={g.featuredImage?.alt || name} width={92} height={92} />
            )}
            <div className="sl-title">
              <h1>{name}</h1>
              {(g.provider?.name || g.udgivet) && (
                <div className="sl-by">
                  {g.provider?.name && (
                    <span>Spillemaskine fra {providerHref ? <Link href={providerHref}>{g.provider.name}</Link> : <b>{g.provider.name}</b>}</span>
                  )}
                  {g.provider?.name && g.udgivet && <span className="sep" aria-hidden="true">·</span>}
                  {g.udgivet && <span className="d">Udgivet {g.udgivet.toLowerCase()}</span>}
                </div>
              )}
            </div>
            {chips.length > 0 && (
              <div className="sl-chips">
                {chips.map((c) => (
                  <span key={c.icon} className={`sl-chip${c.hot ? ' hot' : ''}`}>
                    <Icon name={c.icon} size={15} />{c.label && <>{c.label} </>}<b>{c.value}</b>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`sl-play${casinos.length ? '' : ' no-pick'}`}>
            <SlotDemo
              demoUrl={g.demoUrl}
              name={name}
              poster={poster}
              providerName={g.provider?.name}
              fallbackCta={casinos[0] ? { name: casinos[0].name, url: casinos[0].url } : null}
            />
            <SlotPicker
              slotName={name}
              casinos={casinos}
              moreHref={providerHref ? `${providerHref}#casino-liste` : '/online-casino/'}
              moreLabel={g.provider?.name ? `Se alle casinoer med ${g.provider.name}` : 'Se alle casinoer'}
            />
          </div>
        </div>
      </section>

      <div className="article-layout sl-layout">
        <article className="article-content">
          <MobileToc body={body} />
          {g.intro?.length > 0 && <div className="sl-intro"><PortableTextRenderer value={g.intro} /></div>}
          {specsAt < 0 && hasSpecs && (
            <>
              <h2 className="sl-h2">Nøgletal</h2>
              <SlotSpecs g={g} />
            </>
          )}
          {specsAt < 0
            ? <PortableTextRenderer value={body} />
            : (
              <>
                <PortableTextRenderer value={body.slice(0, specsAt)} />
                <SlotSpecs g={g} id="noegletal" />
                <PortableTextRenderer value={body.slice(specsAt + 1)} />
              </>
            )}
        </article>
        <aside className="sl-side">
          <div className="toc-sidebar sl-side-in">
            <TableOfContents body={body} />
            {casinos.length > 0 && (
              <div className="sl-mini">
                <h4>Her kan du spille {name}</h4>
                {casinos.slice(0, 3).map((c) => (
                  <div className="sl-mini-row" key={c.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.logoUrl ? <img src={c.logoUrl} alt="" width={34} height={34} loading="lazy" /> : <span />}
                    <div><b>{c.name}</b><small>{c.offer}</small></div>
                    <a href={c.url} target="_blank" rel="nofollow noopener noreferrer sponsored">Spil</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {g.related?.length > 0 && g.provider?.name && (
        <section className="sl-rel">
          <div className="sl-rel-h">
            <h2 className="sl-h2">Flere spil fra {g.provider.name}</h2>
            {providerHref && <Link href={providerHref}>Alt om {g.provider.name} <Icon name="alt-arrow-right" size={14} /></Link>}
          </div>
          <div className="sl-rel-g">
            {g.related.map((r: any) => (
              <Link className="sl-card" key={r.slug} href={`/online-spillemaskiner/${r.slug}/`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.img ? <img src={r.img} alt="" width={360} height={270} loading="lazy" /> : <span className="sl-card-ph"><Icon name="gamepad" size={32} /></span>}
                <div>
                  <b>{slotName(r.name)}</b>
                  {r.hasDemo ? <small className="dm"><Icon name="play" size={13} /> Gratis demo</small> : <small>Anmeldelse</small>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}
