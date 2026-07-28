'use client'
import { Icon as Iconify } from '@iconify/react'

export interface SocialLinkData {
  facebook?: string
  x?: string
  instagram?: string
  youtube?: string
  tiktok?: string
  twitch?: string
  linkedin?: string
  discord?: string
  telegram?: string
}

const PLATFORMS: { key: keyof SocialLinkData; icon: string; label: string }[] = [
  { key: 'facebook',  icon: 'simple-icons:facebook',  label: 'Facebook' },
  { key: 'x',         icon: 'simple-icons:x',         label: 'X' },
  { key: 'instagram', icon: 'simple-icons:instagram', label: 'Instagram' },
  { key: 'youtube',   icon: 'simple-icons:youtube',   label: 'YouTube' },
  { key: 'tiktok',    icon: 'simple-icons:tiktok',    label: 'TikTok' },
  { key: 'twitch',    icon: 'simple-icons:twitch',    label: 'Twitch' },
  { key: 'linkedin',  icon: 'simple-icons:linkedin',  label: 'LinkedIn' },
  { key: 'discord',   icon: 'simple-icons:discord',   label: 'Discord' },
  { key: 'telegram',  icon: 'simple-icons:telegram',  label: 'Telegram' },
]

export function SocialLinks({ links }: { links?: SocialLinkData | null }) {
  if (!links) return null
  const active = PLATFORMS.filter((p) => typeof links[p.key] === 'string' && links[p.key])
  if (!active.length) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
      {active.map((p) => (
        <a
          key={p.key}
          href={links[p.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Følg os på ${p.label}`}
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', transition: 'background 0.15s',
          }}
        >
          <Iconify icon={p.icon} width={17} height={17} />
        </a>
      ))}
    </div>
  )
}
