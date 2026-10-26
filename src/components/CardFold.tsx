// Card body text on casino and bonus cards. Always shown in full (no
// "Læs mere" fold); the fold prop is kept so the cards need no changes.
export function CardFold({ children }: { children: React.ReactNode; fold?: boolean }) {
  return <div className="kc-text">{children}</div>
}
