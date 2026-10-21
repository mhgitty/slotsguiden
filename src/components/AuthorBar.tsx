import Link from 'next/link'

interface Author {
  name: string
  slug?: { current: string } | null
  linkedin?: string | null
  imageUrl?: string | null
}

interface AuthorBarProps {
  author?: Author | null
  factChecker?: Author | null
  updatedAt?: string | null
}

function Person({ person, label, short }: { person: Author; label: string; short: string }) {
  const href = person.slug?.current ? `/redaktion/${person.slug.current}/` : null
  return (
    <div className={`ab-cell${short ? ' ab-fc' : ''}`}>
      {person.imageUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={person.imageUrl} alt={person.name} width={36} height={36} className="ab-av" />
        : <span className="ab-av ab-av-empty" aria-hidden="true">{person.name.charAt(0)}</span>}
      <div>
        <small>{label}</small>
        {short && <span className="ab-pre">{short} </span>}
        {href ? <Link href={href} className="ab-name">{person.name}</Link> : <span className="ab-name">{person.name}</span>}
      </div>
    </div>
  )
}

export function AuthorBar({ author, factChecker, updatedAt }: AuthorBarProps) {
  if (!author && !factChecker && !updatedAt) return null

  const dateStr = updatedAt
    ? new Date(updatedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  if (!author && !factChecker && !dateStr) return null

  return (
    <div className="ab">
      {author && <Person person={author} label="Skrevet af" short="" />}
      {factChecker && <Person person={factChecker} label="Faktatjekket af" short="Faktatjek:" />}
      {dateStr && (
        <div className="ab-cell">
          <div>
            <small>Senest opdateret</small>
            <span className="ab-pre">Opdateret </span>
            <time className="ab-name ab-date" dateTime={updatedAt ?? undefined}>{dateStr}</time>
          </div>
        </div>
      )}
    </div>
  )
}
