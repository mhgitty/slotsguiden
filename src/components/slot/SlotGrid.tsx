'use client'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { SlotCard, type SlotCardData } from './SlotCard'
import { slotName } from './slotUtils'

interface Props {
  games: SlotCardData[]
  /** Cards before "Vis flere", and how many each click adds */
  step?: number
  /** Search, sort and "only demo" controls */
  tools?: boolean
  /** Provider chips (archive only) */
  providerFilter?: boolean
  showProvider?: boolean
  label?: string
}

type Sort = 'new' | 'az' | 'rtp'
const rtpNum = (r?: string | null) => (r ? parseFloat(r.replace(',', '.')) || 0 : 0)
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function SlotGrid({ games, step = 24, tools = true, providerFilter = false, showProvider = true, label = 'spillemaskiner' }: Props) {
  const [q, setQ] = useState('')
  const [prov, setProv] = useState<string>('')
  const [demo, setDemo] = useState(false)
  const [sort, setSort] = useState<Sort>('new')
  const [shown, setShown] = useState(step)

  const providers = useMemo(() => {
    const m = new Map<string, { name: string; n: number }>()
    for (const g of games) {
      const p = g.provider
      if (!p?.slug || !p.name) continue
      const e = m.get(p.slug) || { name: p.name, n: 0 }
      e.n++; m.set(p.slug, e)
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n)
  }, [games])

  const list = useMemo(() => {
    const nq = norm(q.trim())
    let out = games.filter((g) =>
      (!nq || norm(slotName(g.name)).includes(nq) || norm(g.provider?.name || '').includes(nq)) &&
      (!prov || g.provider?.slug === prov) &&
      (!demo || g.hasDemo))
    if (sort === 'az') out = [...out].sort((a, b) => slotName(a.name).localeCompare(slotName(b.name), 'da'))
    else if (sort === 'rtp') out = [...out].sort((a, b) => rtpNum(b.rtp) - rtpNum(a.rtp))
    return out
  }, [games, q, prov, demo, sort])

  const reset = (fn: () => void) => { fn(); setShown(step) }
  const visible = list.slice(0, shown)
  const filtered = !!(q || prov || demo)

  if (!games.length) return null

  return (
    <div className="sg-slots">
      {tools && (
        <div className="sgs-tools">
          <label className="sgs-search">
            <Icon name="magnifer" size={18} />
            <input
              type="search" value={q} placeholder={`Søg blandt ${games.length} ${label}…`} aria-label={`Søg ${label}`}
              onChange={(e) => reset(() => setQ(e.target.value))}
            />
          </label>
          <button type="button" className="sgs-toggle" aria-pressed={demo} onClick={() => reset(() => setDemo((d) => !d))}>
            <Icon name="play" size={15} /><span className="sgs-l">Kun med gratis demo</span><span className="sgs-s">Med demo</span>
          </button>
          <label className="sgs-sort">
            <span className="sgs-l">Sortér</span>
            <select value={sort} onChange={(e) => reset(() => setSort(e.target.value as Sort))} aria-label="Sortér">
              <option value="new">Nyeste</option>
              <option value="az">A–Å</option>
              <option value="rtp">Højeste RTP</option>
            </select>
          </label>
        </div>
      )}

      {providerFilter && providers.length > 1 && (
        <div className="sgs-provs" role="group" aria-label="Filtrér efter spiludvikler">
          <button type="button" aria-pressed={!prov} onClick={() => reset(() => setProv(''))}>Alle <span>{games.length}</span></button>
          {providers.map(([slug, p]) => (
            <button key={slug} type="button" aria-pressed={prov === slug} onClick={() => reset(() => setProv(prov === slug ? '' : slug))}>
              {p.name} <span>{p.n}</span>
            </button>
          ))}
        </div>
      )}

      {filtered && (
        <div className="sgs-count" aria-live="polite">
          {list.length === 0 ? `Ingen ${label} matcher.` : `${list.length} ${list.length === 1 ? 'spil' : label}`}
          <button type="button" onClick={() => { setQ(''); setProv(''); setDemo(false); setShown(step) }}>Nulstil</button>
        </div>
      )}

      <div className="sgs-grid">
        {visible.map((g) => <SlotCard key={g._id} g={g} showProvider={showProvider} />)}
      </div>

      {list.length > shown && (
        <div className="sgs-more">
          <button type="button" className="sg-btn-ghost" onClick={() => setShown((n) => n + step)}>
            Vis flere {label} <span>({list.length - shown})</span>
          </button>
        </div>
      )}
    </div>
  )
}
