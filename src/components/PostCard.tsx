import Link from 'next/link'

interface PostCardProps {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  readingTime?: number
  featuredImage?: any
  category?: { name: string; slug: { current: string }; emoji?: string }
  featured?: boolean
}

export function PostCard({ title, slug, excerpt, publishedAt, readingTime, category, featured }: PostCardProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <Link href={`/${slug.current}/`} style={{ textDecoration: 'none' }}>
      <article style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px',
        padding: featured ? '28px' : '20px', height: '100%',
      }}>
        {category && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'rgba(28,127,192,0.12)', color: 'var(--green)', fontSize: '11.5px', fontWeight: 500,
            padding: '3px 10px', borderRadius: '20px', marginBottom: '12px',
          }}>
            {category.emoji} {category.name}
          </div>
        )}
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: featured ? '20px' : '16px',
          fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: '10px', letterSpacing: '-0.02em',
        }}>
          {title}
        </h3>
        {excerpt && (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '16px' }}>
            {excerpt}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-faint)' }}>
          {date && <span>{date}</span>}
          {readingTime && <><span>·</span><span>{readingTime} min. læsning</span></>}
        </div>
      </article>
    </Link>
  )
}
