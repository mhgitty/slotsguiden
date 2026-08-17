import Link from 'next/link'
import { RichIntro } from './RichIntro'
interface AuthorBioProps {
  author: {
    name: string
    slug?: { current: string }
    bio?: string
    intro?: string | any[]
    imageUrl?: string
    linkedin?: string
    x?: string
    facebook?: string
  }
  /** When true (pages): compact row layout, no bio. When false (blog): full card with bio */
  compact?: boolean
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '36px', height: '36px',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text-muted)',
        textDecoration: 'none',
      }}
    >
      {icon}
    </a>
  )
}

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
)

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#000000" aria-hidden="true">
    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z" />
  </svg>
)

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z" />
  </svg>
)

export function AuthorBio({ author, compact = false }: AuthorBioProps) {
  const hasSocials = author.linkedin || author.x || author.facebook

  return (
    <div style={{
      marginTop: compact ? '0' : '56px',
      padding: compact ? '24px 32px' : '28px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
    }}><div className="author-bio-inner">
      {/* Avatar */}
      {author.imageUrl ? (
        <img
          src={author.imageUrl}
          alt={author.name}
          style={{
            width: '175px',
            height: '175px',
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%', flexShrink: 0,
          background: 'rgba(10,95,62,0.12)',
          border: '2px solid rgba(10,95,62,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '52px', fontWeight: 800, color: 'var(--green)',
          fontFamily: 'var(--font-display)',
        }}>
          {author.name.charAt(0)}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
        <div style={{ marginBottom: '3px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Skrevet af
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? '18px' : '17px', fontWeight: 700, color: 'var(--text)', marginBottom: hasSocials ? '12px' : '0' }}>
          {author.slug?.current ? (
            <Link href={`/author/${author.slug.current}/`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
              {author.name}
            </Link>
          ) : author.name}
        </div>

        {(author.intro || author.bio) && (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 16px' }}>
            {author.intro
              ? <RichIntro value={author.intro} />
              : author.bio}
          </p>
        )}

        {hasSocials && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {author.linkedin && <SocialLink href={author.linkedin} label="LinkedIn" icon={<LinkedInIcon />} />}
            {author.x        && <SocialLink href={author.x}        label="X / Twitter" icon={<XIcon />} />}
            {author.facebook  && <SocialLink href={author.facebook} label="Facebook"   icon={<FacebookIcon />} />}
          </div>
        )}
      </div>
    </div>{/* end author-bio-inner */}
    </div>
  )
}
