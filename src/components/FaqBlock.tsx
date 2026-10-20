'use client'
import { useId, useState } from 'react'

interface FaqBlockProps { value: { items?: { question: string; answer: string }[] } }

export function FaqBlock({ value }: FaqBlockProps) {
  const { items = [] } = value
  const [open, setOpen] = useState<number | null>(0)
  const uid = useId()

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
    <div id="faq" className="scroll-anchor" style={{ margin: '32px 0' }}>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div className="sg-faq">
        {items.map((item, i) => {
          const isOpen = open === i
          const qid = `${uid}-q-${i}`
          const aid = `${uid}-a-${i}`
          return (
            <div key={i} className={`sg-faq-item${isOpen ? ' is-open' : ''}`}>
              <div className="sg-faq-h">
                <button
                  id={qid}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={aid}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="sg-faq-q"
                >
                  <span>{item.question}</span>
                  <span className="sg-pm" aria-hidden="true" />
                </button>
              </div>
              {/* Answer stays in the DOM (good for search engines); height animates */}
              <div id={aid} role="region" aria-labelledby={qid} className="sg-faq-a-wrap">
                <div className="sg-faq-a">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
