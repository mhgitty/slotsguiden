import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { MobileToc } from '@/components/MobileToc'
import { TableOfContents } from '@/components/TableOfContents'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { getLigaStillingerBySlug, getLigaStillingerPaths, getSiteSettings } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'
const SM_BASE = 'https://api.sportmonks.com/v3/football'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const paths = await getLigaStillingerPaths()
  return paths.map((p) => ({ slug: p.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getLigaStillingerBySlug(slug).catch(() => null)
  if (!page) return {}
  const title = replaceDateVars(page.metaTitle || page.title)
  const description = replaceDateVars(page.metaDescription || `Se ${page.leagueName} tabel – opdateret live.`)
  const canonical = `${BASE}/fodbold/stillinger/${slug}/`
  return { title, description, alternates: { canonical } }
}

// ─── Sportsmonks helpers ──────────────────────────────────────────────────────

interface StandingRow {
  position: number
  teamName: string
  teamLogo: string | null
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form: string | null
}

async function fetchStandings(leagueId: number, seasonId?: number | null): Promise<StandingRow[]> {
  const token = process.env.SPORTSMONKS_API_TOKEN
  if (!token) {
    console.error('[LigaStillinger] SPORTSMONKS_API_TOKEN is not set')
    return []
  }

  try {
    // Resolve season ID
    let resolvedSeasonId = seasonId
    if (!resolvedSeasonId) {
      // Strategy 1: league include=currentSeason
      const leagueRes = await fetch(
        `${SM_BASE}/leagues/${leagueId}?api_token=${token}&include=currentSeason`,
        { next: { revalidate: 3600 } }
      )
      if (leagueRes.ok) {
        const leagueData = await leagueRes.json()
        resolvedSeasonId = leagueData?.data?.currentseason?.id
      }

      // Strategy 2: fall back to seasons endpoint, pick the latest
      if (!resolvedSeasonId) {
        console.log('[LigaStillinger] Falling back to seasons endpoint for league', leagueId)
        const seasonsRes = await fetch(
          `${SM_BASE}/seasons?api_token=${token}&filters=leagueId:${leagueId}&order=starting_at:desc&per_page=5`,
          { next: { revalidate: 3600 } }
        )
        if (seasonsRes.ok) {
          const seasonsData = await seasonsRes.json()
          const seasons: any[] = Array.isArray(seasonsData?.data) ? seasonsData.data : []
          // Prefer a season marked is_current, else take the first (most recent)
          const current = seasons.find((s: any) => s.is_current) ?? seasons[0]
          resolvedSeasonId = current?.id
        }
      }

      if (!resolvedSeasonId) {
        console.error('[LigaStillinger] Could not resolve season for league', leagueId)
        return []
      }
    }

    // Fetch standings — include participant + details for stats
    const url = `${SM_BASE}/standings/seasons/${resolvedSeasonId}?api_token=${token}&include=participant;details`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      console.error('[LigaStillinger] Standings fetch failed:', res.status)
      return []
    }
    const data = await res.json()
    const rows: any[] = Array.isArray(data?.data) ? data.data : []

    // Sportsmonks v3: details is an array of { type_id, value } objects
    // Common type IDs: 129=GP, 130=W, 131=D, 132=L, 133=GF, 134=GA
    const getDetail = (details: any[], typeId: number): number =>
      details?.find((d: any) => d.type_id === typeId)?.value ?? 0

    const mapped = rows.map((row: any) => {
      const details: any[] = Array.isArray(row.details) ? row.details : []
      const gf = getDetail(details, 133)
      const ga = getDetail(details, 134)
      return {
        position: row.position ?? 0,
        teamName: row.participant?.name ?? '—',
        teamLogo: row.participant?.image_path ?? null,
        played: getDetail(details, 129),
        won:    getDetail(details, 130),
        draw:   getDetail(details, 131),
        lost:   getDetail(details, 132),
        goalsFor: gf,
        goalsAgainst: ga,
        goalDiff: gf - ga,
        points: row.points ?? 0,
        form: row.form ?? null,
      }
    })

    // Deduplicate: keep the entry with the most points for each team
    const seen = new Map<string, StandingRow>()
    for (const row of mapped) {
      const existing = seen.get(row.teamName)
      if (!existing || row.points > existing.points) {
        seen.set(row.teamName, row)
      }
    }

    return Array.from(seen.values())
      .sort((a, b) => b.points - a.points || (b.goalDiff - a.goalDiff))
      .map((row, i) => ({ ...row, position: i + 1 }))
  } catch (err) {
    console.error('[LigaStillinger] Exception:', err)
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LigaStillingerPage({ params }: Props) {
  const { slug } = await params
  const [page, settings] = await Promise.all([
    getLigaStillingerBySlug(slug).catch(() => null),
    getSiteSettings().catch(() => null),
  ])
  if (!page) notFound()

  const author = settings?.defaultAuthor ?? null
  const canonical = `${BASE}/fodbold/stillinger/${slug}/`
  const standings = await fetchStandings(page.leagueId, page.seasonId)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Fodbold', item: `${BASE}/fodbold/` },
          { '@type': 'ListItem', position: 3, name: 'Tabel', item: `${BASE}/fodbold/stillinger/` },
          { '@type': 'ListItem', position: 4, name: page.leagueName, item: canonical },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: replaceDateVars(page.title),
        inLanguage: 'da-DK',
        publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <HreflangLinks docId={(page as any)._id} />
      <Navbar />

      {/* Hero */}
      <section className="hero-section" style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
          <Breadcrumbs crumbs={[
            { label: 'Hjem', href: '/' },
            { label: 'Fodbold', href: '/fodbold' },
            { label: 'Tabel', href: '/fodbold/stillinger' },
            { label: page.leagueName },
          ]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: page.intro ? '16px' : '0' }}>
            {page.logo?.url && (
              <img
                src={page.logo.url}
                alt={page.logo.alt || page.leagueName}
                width={56}
                height={56}
                style={{ objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 3.5vw, 40px)',
              fontWeight: 800,
              color: 'var(--text)',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: 0,
            }}>
              {replaceDateVars(page.title)}
            </h1>
          </div>
          {page.intro && (
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, width: '100%', margin: 0 }}>
              {replaceDateVars(page.intro)}
            </p>
          )}
        </div>
      </section>

      {/* Standings table — full width */}
      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '40px 15px 0' }}>
        <StandingsTable rows={standings} leagueName={page.leagueName} logoUrl={page.logo?.url ?? null} logoAlt={page.logo?.alt ?? null} />
      </div>

      {/* Body text + TOC sidebar */}
      {page.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={page.body} />
            <PortableTextRenderer value={page.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={page.body} />
          </aside>
        </div>
      )}

      {!page.body && <div style={{ paddingBottom: '80px' }} />}

      <Footer />
    </>
  )
}

// ─── Standings table component ────────────────────────────────────────────────

function StandingsTable({ rows, leagueName, logoUrl, logoAlt }: { rows: StandingRow[]; leagueName: string; logoUrl?: string | null; logoAlt?: string | null }) {
  if (!rows.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        color: 'var(--text-faint)',
        fontSize: '14px',
      }}>
        Ingen tabeldata tilgængelig for {leagueName} — kontrollér, at SPORTSMONKS_API_TOKEN er sat i .env.local.
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Table header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {logoUrl
          ? <img src={logoUrl} alt={logoAlt || leagueName} width={24} height={24} style={{ objectFit: 'contain', flexShrink: 0 }} />
          : <span style={{ fontSize: '16px' }}>🏆</span>
        }
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text)',
        }}>
          {leagueName} — Tabel
        </span>
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
              <Th style={{ width: '36px', textAlign: 'center' }}>#</Th>
              <Th style={{ textAlign: 'left' }}>Hold</Th>
              <Th title="Spillede">S</Th>
              <Th title="Vundne">V</Th>
              <Th title="Uafgjorte">U</Th>
              <Th title="Tabte">T</Th>
              <Th title="Scorede mål">SM</Th>
              <Th title="Indkasserede mål">IM</Th>
              <Th title="Målforskel">MF±</Th>
              <Th title="Point" style={{ color: 'var(--green)', fontWeight: 700 }}>P</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid var(--border-faint)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-faint)', fontWeight: 600, fontSize: '12px' }}>
                  {row.position}
                </td>
                <td style={{ padding: '10px 12px 10px 8px', minWidth: '140px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {row.teamLogo
                      ? <img src={row.teamLogo} alt={row.teamName} width={20} height={20} style={{ objectFit: 'contain', flexShrink: 0 }} />
                      : <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                    }
                    <span style={{ fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>{row.teamName}</span>
                  </div>
                </td>
                <Td>{row.played}</Td>
                <Td>{row.won}</Td>
                <Td>{row.draw}</Td>
                <Td>{row.lost}</Td>
                <Td>{row.goalsFor}</Td>
                <Td>{row.goalsAgainst}</Td>
                <Td style={{ color: row.goalDiff > 0 ? 'var(--green)' : row.goalDiff < 0 ? '#f87171' : 'var(--text-muted)' }}>
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </Td>
                <Td style={{ fontWeight: 700, color: 'var(--text)' }}>{row.points}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-faint)', fontSize: '11px', color: 'var(--text-faint)' }}>
        Data fra Sportsmonks · Opdateres hvert 60. minut
      </div>
    </div>
  )
}

function Th({ children, style, title }: { children?: React.ReactNode; style?: React.CSSProperties; title?: string }) {
  return (
    <th title={title} style={{
      padding: '10px 8px',
      textAlign: 'center',
      fontSize: '11px',
      fontWeight: 600,
      color: 'var(--text-faint)',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </th>
  )
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: '10px 8px',
      textAlign: 'center',
      color: 'var(--text-muted)',
      ...style,
    }}>
      {children}
    </td>
  )
}
