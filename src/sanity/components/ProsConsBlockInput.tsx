'use client'
import { useCallback, useState } from 'react'
import type { ObjectInputProps } from 'sanity'
import { PatchEvent, set } from 'sanity'
import { Button, Dialog, TextArea, Stack, Text, Box, Card } from '@sanity/ui'

type Result = { pros: string[]; cons: string[] }

// Heading words that switch which bucket following lines go into.
const PRO_WORDS = /^(pros?|advantages?|positives?|fordele|plusser)$/i
const CON_WORDS = /^(cons?|disadvantages?|negatives?|ulemper|minusser)$/i

// Lines that begin with one of these are routed regardless of the active bucket.
const STARTS_PRO = /^\s*(✅|✔️|✔|☑️|☑|➕|👍|\+)\s+/
const STARTS_CON = /^\s*(❌|✖️|✖|✗|✕|➖|👎|×)\s+/

// Strip a leading bullet / number / dash / emoji marker from a content line.
function cleanItem(line: string): string {
  return line
    .replace(STARTS_PRO, '')
    .replace(STARTS_CON, '')
    .replace(/^[\s>]*[-–—*•▪◦‣·]\s+/, '')
    .replace(/^\s*\d+[.)]\s+/, '')
    .replace(/^[\s>#*_`]+/, '')
    .replace(/[*_`]+$/, '')
    .trim()
}

// Reduce a possible heading to bare letters so "**Pros:**", "### Cons", "✅ Pros" all match.
function headingKey(line: string): string {
  return line.replace(/[^a-zæøåA-ZÆØÅ]/g, '').toLowerCase()
}

// A value that should not become a list item (empty / placeholder cells).
function isBlank(s: string): boolean {
  const t = s.trim()
  return t === '' || /^(-|–|—|n\/?a|none|ingen)$/i.test(t)
}

// ── Table formats (HTML / markdown pipe / TSV): col 0 = pros, col 1 = cons ──
function parseTableRows(input: string): string[][] | null {
  const trimmed = input.trim()

  if (trimmed.toLowerCase().includes('<table')) {
    const doc = new DOMParser().parseFromString(trimmed, 'text/html')
    const table = doc.querySelector('table')
    if (!table) return null
    const rows: string[][] = []
    table.querySelectorAll('tr').forEach((tr) => {
      const cells: string[] = []
      tr.querySelectorAll('th, td').forEach((c) => cells.push(c.textContent?.trim() ?? ''))
      if (cells.length) rows.push(cells)
    })
    return rows.length ? rows : null
  }

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)

  if (lines[0]?.startsWith('|')) {
    const split = (l: string) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
    const data = lines.filter((l) => !/^[|\s\-:]+$/.test(l)) // drop --- separator
    return data.map(split)
  }

  if (lines.some((l) => l.includes('\t'))) {
    return lines.map((l) => l.split('\t').map((c) => c.trim()))
  }

  return null
}

function parseProsCons(input: string): Result {
  const pros: string[] = []
  const cons: string[] = []

  // 1) Two-column table → column 0 pros, column 1 cons.
  const table = parseTableRows(input)
  if (table && table.some((r) => r.length >= 2)) {
    table.forEach((row, idx) => {
      // Skip a "Pros | Cons" header row.
      if (idx === 0 && PRO_WORDS.test(headingKey(row[0] || '')) && CON_WORDS.test(headingKey(row[1] || ''))) return
      const p = cleanItem(row[0] || '')
      const c = cleanItem(row[1] || '')
      if (!isBlank(p)) pros.push(p)
      if (!isBlank(c)) cons.push(c)
    })
    return { pros, cons }
  }

  // 2) Labeled lists and/or emoji-prefixed lines.
  let bucket: 'pros' | 'cons' | null = null
  input.split('\n').forEach((raw) => {
    const line = raw.trim()
    if (!line) return

    const key = headingKey(line)
    // Treat as a heading only if the WHOLE line reduces to a pro/con word.
    if (PRO_WORDS.test(key)) { bucket = 'pros'; return }
    if (CON_WORDS.test(key)) { bucket = 'cons'; return }

    if (STARTS_PRO.test(line)) { const t = cleanItem(line); if (!isBlank(t)) pros.push(t); return }
    if (STARTS_CON.test(line)) { const t = cleanItem(line); if (!isBlank(t)) cons.push(t); return }

    const t = cleanItem(line)
    if (isBlank(t)) return
    if (bucket === 'pros') pros.push(t)
    else if (bucket === 'cons') cons.push(t)
    // No active bucket and no marker → ignore (stray intro text).
  })

  return { pros, cons }
}

export function ProsConsBlockInput(props: ObjectInputProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleImport = useCallback(() => {
    setError('')
    if (!input.trim()) return

    const { pros, cons } = parseProsCons(input)
    if (pros.length === 0 && cons.length === 0) {
      setError('Could not detect any pros or cons. Paste a two-column table, or "Pros:" / "Cons:" lists, straight from ChatGPT.')
      return
    }

    props.onChange(
      PatchEvent.from([
        set(pros, ['pros']),
        set(cons, ['cons']),
      ])
    )
    setOpen(false)
    setInput('')
  }, [input, props])

  return (
    <Stack space={3}>
      <Button
        mode="ghost"
        tone="primary"
        fontSize={1}
        padding={3}
        text="📋 Import pros & cons from ChatGPT"
        onClick={() => { setOpen(true); setError('') }}
      />

      {props.renderDefault(props)}

      {open && (
        <Dialog
          header="Import pros & cons"
          onClose={() => { setOpen(false); setInput(''); setError('') }}
          id="pros-cons-import-dialog"
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1} muted>
                Paste straight from ChatGPT — a two-column table (Pros | Cons), labeled
                &ldquo;Pros:&rdquo; / &ldquo;Cons:&rdquo; lists, or ✅ / ❌ lines all work.
              </Text>
              <TextArea
                rows={10}
                value={input}
                onChange={(e) => setInput((e.target as HTMLTextAreaElement).value)}
                placeholder={'Paste pros & cons here…'}
              />
              {error && (
                <Card tone="critical" padding={3} radius={2}>
                  <Text size={1}>{error}</Text>
                </Card>
              )}
              <Button
                text="Convert & insert"
                tone="primary"
                onClick={handleImport}
              />
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
