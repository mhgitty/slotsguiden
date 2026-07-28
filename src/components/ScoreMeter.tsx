'use client'

import { useEffect, useState } from 'react'

function getScoreColor(score: number): string {
  if (score >= 7.5) return 'var(--green)'
  if (score >= 6.5) return '#EAB308'
  if (score >= 5.0) return '#F97316'
  return '#EF4444'
}

function getBarColor(score: number): string {
  if (score >= 7.5) return 'var(--green-dark)'
  if (score >= 6.5) return '#CA8A04'
  if (score >= 5.0) return '#EA580C'
  return '#DC2626'
}

export function ScoreMeter({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0)
  const [filled, setFilled] = useState(0)

  useEffect(() => {
    const duration = 900
    const steps = 60
    const interval = duration / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      const progress = step / steps
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(parseFloat((eased * score).toFixed(1)))
      setFilled(eased * score)
      if (step >= steps) {
        clearInterval(timer)
        setDisplayed(score)
        setFilled(score)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [score])

  const color = getScoreColor(score)
  const barColor = getBarColor(score)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        fontSize: '36px', fontWeight: 800,
        fontFamily: 'var(--font-display)',
        color,
        transition: 'color 0.3s',
        minWidth: '64px',
      }}>
        {displayed.toFixed(1)}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>af 10</div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[...Array(10)].map((_, i) => {
            const threshold = i + 1
            const fillRatio = Math.min(1, Math.max(0, filled - i))
            return (
              <div key={i} style={{
                width: '14px', height: '6px', borderRadius: '3px',
                position: 'relative',
                background: 'var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: barColor,
                  width: `${fillRatio * 100}%`,
                  transition: 'width 0.02s linear',
                }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
