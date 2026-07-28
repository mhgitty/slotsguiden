import Link from 'next/link'
import { PostCard } from './PostCard'

type Post = {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  readingTime?: number
  category?: { name: string; emoji?: string; slug: { current: string } }
}

type LatestPostsBlockProps = {
  value: {
    title?: string
    count?: number
    showViewAll?: boolean
  }
  posts: Post[]
}

export function LatestPostsBlock({ value, posts }: LatestPostsBlockProps) {
  const { title = 'Seneste guider & artikler', count = 4, showViewAll = true } = value

  const visiblePosts = posts.slice(0, count)

  if (visiblePosts.length === 0) return null

  const featuredPost = count >= 3 ? visiblePosts[0] : null
  const restPosts = count >= 3 ? visiblePosts.slice(1) : visiblePosts

  return (
    <div style={{ margin: '40px 0' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '20px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.03em',
          margin: 0,
        }}>
          {title}
        </h2>
        {showViewAll && (
          <Link href="/news/" style={{ fontSize: '13px', color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>
            Vis alle →
          </Link>
        )}
      </div>

      {/* Grid */}
      {count >= 3 && featuredPost ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'start' }}>
          <PostCard {...featuredPost} featured />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {restPosts.slice(0, 3).map((post) => (
              <PostCard key={post._id} {...post} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignItems: 'start' }}>
          {visiblePosts.map((post) => (
            <PostCard key={post._id} {...post} />
          ))}
        </div>
      )}
    </div>
  )
}
