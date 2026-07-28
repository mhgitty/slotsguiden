interface AuthorMetaProps {
  author: {
    name: string
    imageUrl?: string
  }
  lastUpdated?: string
  publishedAt?: string
}

export function AuthorMeta({ author, lastUpdated, publishedAt }: AuthorMetaProps) {
  const dateStr = lastUpdated || publishedAt
  const date = dateStr
    ? new Date(dateStr).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      marginBottom: '36px',
    }}>
      {author.imageUrl ? (
        <img
          src={author.imageUrl}
          alt={author.name}
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(28,127,192,0.12)',
          border: '1px solid rgba(28,127,192,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: 'var(--green)', flexShrink: 0,
        }}>
          {author.name.charAt(0)}
        </div>
      )}

      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
          {author.name}
        </div>
        {date && (
          <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '1px' }}>
            Senest opdateret: {date}
          </div>
        )}
      </div>
    </div>
  )
}
