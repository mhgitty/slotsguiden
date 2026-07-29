import Link from 'next/link'
import Image from 'next/image'
import { getPosts, getRecentBonuses } from '@/lib/sanity'

const FREE_SPINS_URL = '/free-spins-til-eksisterende-kunder/'
const INDBETALINGSBONUS_URL = '/casino-bonus/indbetalingsbonus/'

function formatDK(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

const btn: React.CSSProperties = {
  display: 'block', textAlign: 'center', background: 'var(--btn)', color: '#fff',
  padding: '13px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
  textDecoration: 'none',
}

export async function LatestContentBlock() {
  const [posts, bonuses] = await Promise.all([
    getPosts(1).catch(() => []),
    getRecentBonuses(5).catch(() => []),
  ])
  const post: any = Array.isArray(posts) ? posts[0] : null
  const bonusList: any[] = Array.isArray(bonuses) ? bonuses : []

  if (!post && bonusList.length === 0) return null

  return (
    <section style={{ maxWidth: '1250px', margin: '64px auto 0', padding: '0 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* ── LEFT: latest blog post ── */}
        {post && (
          <div style={{ border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative' }}>
              {post.featuredImage?.url ? (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                  <Image src={post.featuredImage.url} alt={post.featuredImage.alt ?? post.title ?? ''} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 600px" />
                </div>
              ) : (
                <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--bg-raised)' }} />
              )}
              <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--green)', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '6px' }}>
                Seneste indlæg
              </span>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Link href={`/${post.slug?.current ?? ''}/`} style={{ textDecoration: 'none' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, margin: 0 }}>
                  {post.title}
                </h3>
              </Link>
              {post.publishedAt && (
                <div style={{ fontSize: '13px', color: 'var(--text-faint)', marginTop: '6px' }}>{formatDK(post.publishedAt)}</div>
              )}
              {post.excerpt && (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '12px', marginBottom: 0 }}>
                  {post.excerpt.length > 160 ? post.excerpt.slice(0, 160).trimEnd() + '…' : post.excerpt}
                </p>
              )}
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <Link href="/blog/" style={btn}>Se flere blogindlæg og nyheder</Link>
              </div>
            </div>
          </div>
        )}

        {/* ── RIGHT: recent casino bonuses ── */}
        {bonusList.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--bg-card)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
              Nyeste free spins og casino kampagner
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {bonusList.map((b) => {
                const href = b.slug ? `/casino-kampagner/${b.slug}/` : (b.offerUrl || '#')
                return (
                  <div key={b._id} style={{ borderTop: '1px solid var(--border-faint)', padding: '14px 0' }}>
                    <Link href={href} style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', lineHeight: 1.35, display: 'block' }}>
                      {b.title}
                    </Link>
                    {b.date && <div style={{ fontSize: '13px', color: 'var(--text-faint)', marginTop: '4px' }}>{formatDK(b.date)}</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto', paddingTop: '20px' }}>
              <Link href={FREE_SPINS_URL} style={btn}>Se alle free spins tilbud</Link>
              <Link href={INDBETALINGSBONUS_URL} style={btn}>Indbetalingsbonusser</Link>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
