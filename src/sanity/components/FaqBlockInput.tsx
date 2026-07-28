'use client'
import { useCallback, useState } from 'react'
import type { ObjectInputProps } from 'sanity'
import { PatchEvent, set } from 'sanity'
import { Button, Dialog, TextArea, Stack, Text, Box, Card } from '@sanity/ui'

type FaqItem = { _type: 'faqItem'; _key: string; question: string; answer: string }

function key() {
  return Math.random().toString(36).slice(2, 9)
}

// ── Parsers ────────────────────────────────────────────────────────────────────

function parseHtml(html: string): FaqItem[] | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3, h4')
  if (!headings.length) return null

  const items: FaqItem[] = []
  headings.forEach((h) => {
    const question = h.textContent?.trim() ?? ''
    const answerParts: string[] = []
    let next = h.nextElementSibling
    while (next && !['H2', 'H3', 'H4'].includes(next.tagName)) {
      const text = next.textContent?.trim()
      if (text) answerParts.push(text)
      next = next.nextElementSibling
    }
    if (question) {
      items.push({ _type: 'faqItem', _key: key(), question, answer: answerParts.join('\n\n') })
    }
  })
  return items.length ? items : null
}

function parseMarkdown(text: string): FaqItem[] | null {
  // Handles ### heading + body text blocks, or **Bold question** lines
  const items: FaqItem[] = []

  // Try ### / ## headings first
  const headingRegex = /^#{1,4}\s+(.+)$/m
  if (headingRegex.test(text)) {
    const blocks = text.split(/^#{1,4}\s+/m).filter(Boolean)
    for (const block of blocks) {
      const lines = block.split('\n')
      const question = lines[0].trim()
      const answer = lines
        .slice(1)
        .join('\n')
        .replace(/^\s+|\s+$/g, '')
        // Remove markdown bold/italic from answer
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
      if (question) {
        items.push({ _type: 'faqItem', _key: key(), question, answer })
      }
    }
    return items.length ? items : null
  }

  // Try **Bold question** on its own line
  const boldRegex = /^\*\*(.+?)\*\*\s*$/m
  if (boldRegex.test(text)) {
    const parts = text.split(/\n(?=\*\*[^*]+\*\*\s*$)/)
    for (const part of parts) {
      const match = part.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)/)
      if (match) {
        const question = match[1].trim()
        const answer = match[2].trim().replace(/\*\*(.+?)\*\*/g, '$1')
        if (question) {
          items.push({ _type: 'faqItem', _key: key(), question, answer })
        }
      }
    }
    return items.length ? items : null
  }

  return null
}

function parseNumbered(text: string): FaqItem[] | null {
  // "1. Question\nAnswer\n\n2. Next question\nAnswer"
  const blocks = text.split(/\n(?=\d+\.\s)/).filter(Boolean)
  if (blocks.length < 2) return null

  const items: FaqItem[] = []
  for (const block of blocks) {
    const match = block.match(/^\d+\.\s+(.+?)\n([\s\S]*)/)
    if (match) {
      const question = match[1].trim()
      const answer = match[2].trim()
      if (question) {
        items.push({ _type: 'faqItem', _key: key(), question, answer })
      }
    }
  }
  return items.length > 1 ? items : null
}

function parseInput(input: string): FaqItem[] | null {
  const trimmed = input.trim()
  if (trimmed.toLowerCase().includes('<h')) return parseHtml(trimmed)
  const md = parseMarkdown(trimmed)
  if (md) return md
  return parseNumbered(trimmed)
}

// ── Component ──────────────────────────────────────────────────────────────────

export function FaqBlockInput(props: ObjectInputProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<FaqItem[] | null>(null)

  const handlePreview = useCallback(() => {
    setError('')
    if (!input.trim()) return
    const result = parseInput(input)
    if (!result) {
      setError("Couldn't recognise the format. Paste the text directly from ChatGPT — it works with ### headings, **Bold** questions, or numbered lists.")
      setPreview(null)
      return
    }
    setPreview(result)
  }, [input])

  const handleImport = useCallback(() => {
    if (!preview) return
    props.onChange(PatchEvent.from([set(preview, ['items'])]))
    setOpen(false)
    setInput('')
    setPreview(null)
  }, [preview, props])

  return (
    <Stack space={3}>
      <Button
        mode="ghost"
        tone="primary"
        fontSize={1}
        padding={3}
        text="📋 Import FAQ from ChatGPT"
        onClick={() => { setOpen(true); setError(''); setPreview(null) }}
      />

      {props.renderDefault(props)}

      {open && (
        <Dialog
          header="Import FAQ from ChatGPT"
          onClose={() => { setOpen(false); setInput(''); setError(''); setPreview(null) }}
          id="faq-import-dialog"
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1} muted>
                Paste ChatGPT output directly — works with ### headings, **bold** questions, or numbered lists. Each heading becomes a question; the text below it becomes the answer.
              </Text>
              <TextArea
                rows={12}
                value={input}
                onChange={(e) => {
                  setInput((e.target as HTMLTextAreaElement).value)
                  setPreview(null)
                  setError('')
                }}
                placeholder={'### What is the minimum deposit?\n\nThe minimum deposit is $10...\n\n### How do I withdraw?\n\nYou can withdraw via...'}
              />
              {error && (
                <Card tone="critical" padding={3} radius={2}>
                  <Text size={1}>{error}</Text>
                </Card>
              )}

              {/* Preview */}
              {preview && (
                <Card tone="positive" padding={3} radius={2}>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">✅ Found {preview.length} FAQ items — ready to import:</Text>
                    {preview.map((item, i) => (
                      <Box key={item._key} paddingLeft={2}>
                        <Text size={1} weight="semibold">{i + 1}. {item.question}</Text>
                        {item.answer && (
                          <Text size={1} muted style={{ marginTop: 2 }}>
                            {item.answer.length > 100 ? item.answer.slice(0, 100) + '…' : item.answer}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Card>
              )}

              <Stack space={2}>
                {!preview ? (
                  <Button text="Preview FAQ items" tone="primary" onClick={handlePreview} />
                ) : (
                  <Button text={`Insert ${preview.length} FAQ items`} tone="positive" onClick={handleImport} />
                )}
              </Stack>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
