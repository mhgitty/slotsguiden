import { Icon } from '@/components/Icon'

interface ProsConsBlockProps { value: { title?: string; pros?: string[]; cons?: string[] } }

// One joined card: Fordele | Ulemper side by side (stacked on mobile), with a
// count on each side so the balance reads at a glance.
export function ProsConsBlock({ value }: ProsConsBlockProps) {
  const { title, pros = [], cons = [] } = value
  return (
    <div id="pros-cons" className="scroll-anchor sg-pc-wrap">
      {title && <h3 className="sg-pc-title">{title}</h3>}
      <div className="sg-pc">
        <div className="sg-pc-col is-pros">
          <div className="sg-pc-head">
            <span className="sg-pc-ico"><Icon name="like" size={16} /></span>
            Fordele
            <em>{pros.length}</em>
          </div>
          <ul>
            {pros.map((p, i) => (
              <li key={i}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sg-pc-col is-cons">
          <div className="sg-pc-head">
            <span className="sg-pc-ico"><Icon name="dislike" size={16} /></span>
            Ulemper
            <em>{cons.length}</em>
          </div>
          <ul>
            {cons.map((c, i) => (
              <li key={i}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
