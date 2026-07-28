'use client'
import { useState } from 'react'
import { Icon } from '@/components/Icon'

interface FaqBlockProps { value: { items?: { question: string; answer: string }[] } }

export function FaqBlock({ value }: FaqBlockProps) {
  const { items = [] } = value
  const [open, setOpen] = useState<number | null>(0)

  // Emit FAQPage structured data for any FAQ block, on any page that renders it.
  const faqs = items.filter((i) => i?.question && i?.answer)
  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null

  return (
    <div style={{ margin: '32px 0' }}>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '20px 24px',
                  background: isOpen ? '#fff' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  lineHeight: 1.4,
                }}
              >
                <span>{item.question}</span>

                {/* question-circle icon */}
                <Icon
                  name="question-circle"
                  size={28}
                  color={isOpen ? 'var(--green)' : 'var(--text-faint)'}
                  style={{ flexShrink: 0, transition: 'color 0.2s' }}
                />
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 24px 20px',
                  fontSize: '14.5px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  background: '#fff',
                }}>
                  {item.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
