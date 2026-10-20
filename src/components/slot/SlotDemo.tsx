'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'

interface Props {
  demoUrl?: string | null
  name: string
  poster?: string | null
  providerName?: string | null
  /** First casino in the picker, used when there is no demo */
  fallbackCta?: { name: string; url: string } | null
}

const DESKTOP = '(min-width: 761px)'

/**
 * The demo box. On desktop the game starts loading as soon as the page is
 * ready; on phones it starts when the box scrolls into view (games are heavy).
 */
export function SlotDemo({ demoUrl, name, poster, providerName, fallbackCta }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState(false)
  const [ready, setReady] = useState(false)
  const [run, setRun] = useState(0)
  const [full, setFull] = useState(false) // CSS fallback when the Fullscreen API is missing (iPhone)
  const [nativeFs, setNativeFs] = useState(false)

  useEffect(() => {
    const on = () => setNativeFs(document.fullscreenElement === boxRef.current)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  useEffect(() => {
    if (!demoUrl || start) return
    const box = boxRef.current
    if (window.matchMedia(DESKTOP).matches || !('IntersectionObserver' in window) || !box) {
      const t = setTimeout(() => setStart(true), 50)
      return () => clearTimeout(t)
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setStart(true); io.disconnect() }
    }, { rootMargin: '150px 0px' })
    io.observe(box)
    return () => io.disconnect()
  }, [demoUrl, start])

  const restart = () => { setReady(false); setStart(true); setRun((n) => n + 1) }

  const closeFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    setFull(false)
  }, [])

  const openFull = () => {
    const box = boxRef.current
    if (!box) return
    if (!start) setStart(true)
    if (box.requestFullscreen && document.fullscreenEnabled) box.requestFullscreen().catch(() => setFull(true))
    else setFull(true)
  }

  useEffect(() => {
    if (!full) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [full])

  if (!demoUrl) {
    return (
      <div className="sl-demo">
        <div className="sl-nodemo">
          {poster && /* eslint-disable-next-line @next/next/no-img-element */ <img className="sl-nodemo-bg" src={poster} alt="" aria-hidden="true" />}
          <div className="sl-nodemo-c">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {poster && <img src={poster} alt={name} width={84} height={84} />}
            <b>Demoen er ikke tilgængelig lige nu</b>
            <p>Du kan stadig prøve {name} hos et af casinoerne. Mange giver free spins eller en bonus, du kan bruge på spillet.</p>
            {fallbackCta && (
              <a className="sg-cta" href={fallbackCta.url} target="_blank" rel="nofollow noopener noreferrer sponsored">
                Spil hos {fallbackCta.name}
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`sl-demo${full ? ' is-full' : ''}${nativeFs ? ' is-native-fs' : ''}`} ref={boxRef} id="demo">
      <div className="sl-dbar">
        <span className="sl-live"><i aria-hidden="true" />Gratis demo</span>
        <small>Spillepenge · ingen indbetaling · ingen konto</small>
        <div className="sl-dbtn">
          <button type="button" onClick={restart} aria-label="Genstart demo"><Icon name="restart" size={16} /><span>Genstart</span></button>
          {full || nativeFs
            ? <button type="button" onClick={closeFull} aria-label="Luk fuld skærm"><Icon name="close-circle" size={16} /><span>Luk</span></button>
            : <button type="button" onClick={openFull} aria-label="Fuld skærm"><Icon name="maximize-square" size={16} /><span>Fuld skærm</span></button>}
        </div>
      </div>
      <div className="sl-screen">
        {start && (
          <iframe
            key={run}
            src={demoUrl}
            title={`${name} gratis demo`}
            allow="fullscreen; autoplay"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setReady(true)}
          />
        )}
        <div className={`sl-loader${ready ? ' is-done' : ''}`} aria-hidden={ready}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {poster && <img src={poster} alt="" />}
          <div>
            {start ? <span className="sl-spin" /> : (
              <button type="button" className="sl-playbtn" onClick={() => setStart(true)} aria-label={`Start ${name} demo`}>
                <Icon name="play" size={28} />
              </button>
            )}
            {start ? `Starter ${name}…` : 'Tryk for at spille gratis'}
          </div>
        </div>
      </div>
      <div className="sl-dfoot">
        <span>Demoen leveres af {providerName || 'spiludvikleren'}. Gevinster i demo kan ikke udbetales.</span>
        <span>18+ · Spil ansvarligt</span>
      </div>
    </div>
  )
}
