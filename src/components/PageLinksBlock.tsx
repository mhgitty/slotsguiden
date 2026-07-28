import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { getLinkedPages, relatedItemHref } from '@/lib/sanity'

interface PageLinksBlockProps {
  value: {
    heading?: string
    items?: { _key?: string; page?: { _ref?: string }; label?: string }[]
  }
}

/**
 * "Sidelinks" body block — et gitter med linkbokse, der peger mod valgte sider.
 * Opløser sine egne referencer, så sideskabeloner ikke behøver nogen GROQ-ændringer.
 */
export async function PageLinksBlock({ value }: PageLinksBlockProps) {
  const entries = (value?.items || []).filter((i) => i?.page?._ref)
  if (entries.length === 0) return null

  const ids = entries.map((i) => i.page!._ref!) as string[]
  const labelById = new Map(entries.map((i) => [i.page!._ref!, i.label]))

  let items: any[] = []
  try {
    items = await getLinkedPages(ids)
  } catch {
    return null
  }
  if (items.length === 0) return null

  return (
    <div style={{ margin: '32px 0' }}>
      {value.heading && (
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 18px',
          }}
        >
          {value.heading}
        </h2>
      )}

      <div className="pagelinks-grid">
        {items.map((item) => {
          const label = labelById.get(item._id) || item.title || item.name || 'Læs mere'
          return (
            <Link
              key={item._id}
              href={relatedItemHref(item)}
              className="pagelinks-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '16px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  lineHeight: 1.35,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="alt-arrow-right" size={14} color="#fff" />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
