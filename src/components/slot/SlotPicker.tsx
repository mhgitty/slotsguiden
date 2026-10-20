'use client'
import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'

export interface PickerCasino {
  id: string
  name: string
  score?: number
  url: string
  offer: string
  min?: string | null
  wager?: string | null
  logoUrl?: string
  terms?: ReactNode
}

interface Props {
  slotName: string
  casinos: PickerCasino[]
  moreHref?: string | null
  moreLabel?: string | null
}

export function SlotPicker({ slotName, casinos, moreHref, moreLabel }: Props) {
  const [i, setI] = useState(0)
  if (!casinos.length) return null
  const c = casinos[Math.min(i, casinos.length - 1)]

  return (
    <div className="sl-pick" id="spil-for-penge">
      <div>
        <div className="sl-pick-h">Spil {slotName} for rigtige penge</div>
        <div className="sl-pick-s"><Icon name="shield-check" size={15} />Alle med licens fra Spillemyndigheden</div>
      </div>

      <div className="sl-opts" role="radiogroup" aria-label="Vælg casino">
        {casinos.map((x, j) => (
          <button key={x.id} type="button" role="radio" aria-checked={j === i} className="sl-opt" onClick={() => setI(j)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {x.logoUrl ? <img src={x.logoUrl} alt="" width={34} height={34} loading="lazy" /> : <span className="sl-opt-ph">{x.name[0]}</span>}
            <span className="sl-opt-t">
              <b>{x.name}{x.score ? <em> ★ {x.score.toFixed(1)}</em> : null}</b>
              <small>{x.offer}</small>
            </span>
            <span className="sl-rd" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="sl-strip" role="radiogroup" aria-label="Vælg casino">
        {casinos.map((x, j) => (
          <button key={x.id} type="button" role="radio" aria-checked={j === i} onClick={() => setI(j)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {x.logoUrl ? <img src={x.logoUrl} alt="" width={40} height={40} loading="lazy" /> : <span className="sl-opt-ph">{x.name[0]}</span>}
            <small>{x.name}</small>
          </button>
        ))}
      </div>

      <div className="sl-offer">
        <div className="sl-offer-t">{c.offer}</div>
        {(c.min || c.wager) && (
          <div className="sl-offer-m">
            {c.min && <span>Min. indskud <b>{c.min}</b></span>}
            {c.wager && <span>Gennemspil <b>{c.wager}</b></span>}
          </div>
        )}
        <a className="sg-cta sl-cta" href={c.url} target="_blank" rel="nofollow noopener noreferrer sponsored">
          Spil hos {c.name} <Icon name="alt-arrow-right" size={16} />
        </a>
        {c.terms && <div className="sl-terms">{c.terms}</div>}
      </div>

      {moreHref && (
        <a className="sl-more" href={moreHref}>{moreLabel} <Icon name="alt-arrow-right" size={14} /></a>
      )}
    </div>
  )
}
