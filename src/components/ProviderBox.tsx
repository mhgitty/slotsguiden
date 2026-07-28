import Link from 'next/link'
import { getProviderBoxItems, type ProviderBoxItem } from '@/lib/sanity'

interface ProviderBoxProps {
  value: {
    provider?: 'paymentMethod' | 'software'
    items?: { _ref?: string }[]
    limit?: number
  }
}

function hrefFor(item: ProviderBoxItem): string {
  const segment = item._type === 'software' ? 'software' : 'payment'
  const slug = item.slug?.current
  if (!slug) return `/online-casino/${segment}/`
  return `/online-casino/${segment}/${slug}/`
}

export async function ProviderBox({ value }: ProviderBoxProps) {
  const provider = value?.provider === 'software' ? 'software' : 'paymentMethod'
  const ids = (value?.items || []).map((i) => i?._ref).filter(Boolean) as string[]

  let items: ProviderBoxItem[] = []
  try {
    items = await getProviderBoxItems({
      provider,
      ids,
      limit: value?.limit,
    })
  } catch {
    return null
  }

  if (!items.length) return null

  return (
    <div className="pbox" style={{ margin: '28px 0' }}>
      <div className="pbox-grid">
        {items.map((item) => (
          <Link
            key={item._id}
            href={hrefFor(item)}
            className="pbox-item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '18px 12px',
              background: '#fff',
              border: '1px solid var(--border-faint)',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            {item.logo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logo.url}
                alt={item.logo.alt || item.name || ''}
                loading="lazy"
                style={{
                  height: '34px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--green)',
                }}
              >
                {(item.name || '?').slice(0, 2).toUpperCase()}
              </div>
            )}
            <span
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text)',
                lineHeight: 1.3,
              }}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
