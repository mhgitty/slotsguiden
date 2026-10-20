'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/Icon'

interface Entry { k: string; t: string; s?: string; h: string; l?: string; sc?: number }

const GROUPS: Record<string, string> = {
  casino: 'Casinoer', page: 'Sider', payment: 'Betalingsmetoder', provider: 'Spiludviklere',
  bonus: 'Kampagner', guide: 'Guides', post: 'Artikler', slot: 'Spillemaskiner',
}
const ORDER = ['casino', 'page', 'payment', 'provider', 'guide', 'post', 'slot', 'bonus']
const ICONS: Record<string, string> = {
  page: 'document-text', payment: 'card', provider: 'gamepad', guide: 'book-2', post: 'pen-new-square', slot: 'gamepad', bonus: 'gift',
}
const POPULAR = ['Free spins i dag', 'Uden indbetaling', 'MobilePay', 'Hurtig udbetaling', 'Nye casinoer']
const MAX = 9

let indexCache: Entry[] | null = null
let indexPromise: Promise<Entry[]> | null = null
function loadIndex(): Promise<Entry[]> {
  if (indexCache) return Promise.resolve(indexCache)
  if (!indexPromise) {
    indexPromise = fetch('/api/search-index/')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Entry[]) => (indexCache = d))
      .catch(() => { indexPromise = null; return [] })
  }
  return indexPromise
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

function rank(entries: Entry[], query: string): Entry[] {
  const q = norm(query)
  if (!q) return []
  const words = q.split(' ')
  const scored: { e: Entry; s: number }[] = []
  for (const e of entries) {
    const t = norm(e.t)
    const hay = t + ' ' + norm(e.s || '')
    if (!words.every((w) => hay.includes(w))) continue
    let s = 0
    if (t === q) s += 100
    else if (t.startsWith(q)) s += 60
    else if (t.split(' ').some((w) => w.startsWith(words[0]))) s += 30
    s += { casino: 25, page: 20, payment: 12, provider: 10, guide: 8, post: 4, slot: 2, bonus: 6 }[e.k] ?? 0
    if (e.sc) s += e.sc
    scored.push({ e, s })
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, MAX).map((x) => x.e)
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<Entry[] | null>(indexCache)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setActive(0)
    loadIndex().then(setEntries)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    document.body.classList.add('search-open')
    return () => { clearTimeout(t); document.body.classList.remove('search-open') }
  }, [open])

  const results = useMemo(() => {
    if (!entries) return []
    if (query.trim()) return rank(entries, query)
    // Empty query: top casinos as a starting point
    return entries.filter((e) => e.k === 'casino').slice(0, 4)
  }, [entries, query])

  useEffect(() => { setActive(0) }, [query])

  if (!open) return null

  const go = (e?: Entry) => {
    if (!e) return
    onClose(); setQuery('')
    router.push(e.h)
  }

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Escape') { ev.preventDefault(); onClose() }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (ev.key === 'Enter') { ev.preventDefault(); go(results[active]) }
  }

  // Group the ranked list while keeping rank order inside each group
  const groups: { k: string; items: { e: Entry; i: number }[] }[] = []
  if (query.trim()) {
    const seen = new Map<string, { e: Entry; i: number }[]>()
    results.forEach((e, i) => { if (!seen.has(e.k)) seen.set(e.k, []); seen.get(e.k)!.push({ e, i }) })
    ORDER.forEach((k) => { if (seen.has(k)) groups.push({ k, items: seen.get(k)! }) })
  } else if (results.length) {
    groups.push({ k: 'top', items: results.map((e, i) => ({ e, i })) })
  }
  // Flattened order must match the keyboard index
  const flat = groups.flatMap((g) => g.items)

  return (
    <div className="ss" role="dialog" aria-modal="true" aria-label="Søg på Slotsguiden" onKeyDown={onKey}>
      <div className="ss-backdrop" onClick={onClose} />
      <div className="ss-box">
        <div className="ss-in">
          <Icon name="magnifer" size={21} color="var(--green)" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg efter casino, bonus eller guide…"
            aria-label="Søg"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="button" className="ss-esc" onClick={onClose} aria-label="Luk søgning">Esc</button>
        </div>

        {!query.trim() && (
          <div className="ss-pop">
            {POPULAR.map((p) => <button key={p} type="button" onClick={() => setQuery(p)}>{p}</button>)}
          </div>
        )}

        <div className="ss-body" role="listbox" aria-label="Resultater">
          {entries === null && <div className="ss-empty">Henter…</div>}
          {entries !== null && query.trim() && flat.length === 0 && (
            <div className="ss-empty">Ingen resultater for “{query}”. Prøv et casinonavn eller “free spins”.</div>
          )}
          {groups.map((g) => (
            <div key={g.k}>
              <div className="ss-group">{g.k === 'top' ? 'Topcasinoer lige nu' : GROUPS[g.k]}</div>
              {g.items.map(({ e }) => {
                const idx = flat.findIndex((x) => x.e === e)
                return (
                  <a
                    key={e.k + e.h}
                    href={e.h}
                    role="option"
                    aria-selected={idx === active}
                    className={`ss-row${idx === active ? ' is-active' : ''}`}
                    onMouseEnter={() => setActive(idx)}
                    onClick={(ev) => { ev.preventDefault(); go(e) }}
                  >
                    {e.l
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={e.l} alt="" width={36} height={36} className="ss-logo" loading="lazy" />
                      : <span className="ss-ic"><Icon name={ICONS[e.k] || 'document-text'} size={17} /></span>}
                    <span className="ss-text">
                      <b>{e.t}</b>
                      {(e.s || e.sc != null) && (
                        <small>{e.sc != null ? `★ ${e.sc.toFixed(1)}${e.s ? ' · ' : ''}` : ''}{e.s}</small>
                      )}
                    </span>
                    <Icon name="arrow-right" size={15} className="ss-go" />
                  </a>
                )
              })}
            </div>
          ))}
        </div>
        <div className="ss-foot"><span><kbd>↑</kbd><kbd>↓</kbd> vælg</span><span><kbd>Enter</kbd> åbn</span><span><kbd>Esc</kbd> luk</span></div>
      </div>
    </div>
  )
}
