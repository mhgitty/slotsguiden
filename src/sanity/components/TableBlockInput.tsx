'use client'
import { useCallback, useState } from 'react'
import type { ObjectInputProps } from 'sanity'
import { PatchEvent, set } from 'sanity'
import { Button, Dialog, TextArea, Stack, Text, Box, Card } from '@sanity/ui'

type TableData = { headers: string[]; rows: Array<{ _type: string; _key: string; cells: string[] }> }

function parseHtml(html: string): TableData | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const table = doc.querySelector('table')
  if (!table) return null

  const headers: string[] = []
  const theadCells = table.querySelectorAll('thead tr:first-child th, thead tr:first-child td')
  if (theadCells.length > 0) {
    theadCells.forEach((c) => headers.push(c.textContent?.trim() ?? ''))
  }

  const rowEls = headers.length > 0 ? table.querySelectorAll('tbody tr') : table.querySelectorAll('tr')
  const rows: TableData['rows'] = []
  rowEls.forEach((row, idx) => {
    if (headers.length === 0 && idx === 0) {
      row.querySelectorAll('th, td').forEach((c) => headers.push(c.textContent?.trim() ?? ''))
      return
    }
    const cells: string[] = []
    row.querySelectorAll('td, th').forEach((c) => cells.push(c.textContent?.trim() ?? ''))
    if (cells.some((c) => c !== '')) {
      rows.push({ _type: 'tableRow', _key: Math.random().toString(36).slice(2, 9), cells })
    }
  })
  return { headers, rows }
}

function parseTsv(text: string): TableData | null {
  // Tab-separated (what ChatGPT produces when you copy a table)
  const lines = text.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim())
  if (lines.length < 2) return null

  const splitLine = (line: string) => line.split('\t').map((c) => c.trim())
  const firstRow = splitLine(lines[0])
  if (firstRow.length < 2) return null

  const headers = firstRow
  const rows: TableData['rows'] = lines.slice(1).map((line) => ({
    _type: 'tableRow',
    _key: Math.random().toString(36).slice(2, 9),
    cells: splitLine(line),
  })).filter((r) => r.cells.some((c) => c !== ''))
  return { headers, rows }
}

function parseMarkdown(text: string): TableData | null {
  // Markdown pipe tables: | col1 | col2 |
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'))
  if (lines.length < 2) return null

  const splitRow = (line: string) =>
    line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())

  const headers = splitRow(lines[0])
  // Skip separator row (---|---)
  const dataLines = lines.slice(1).filter((l) => !/^[\|\s\-:]+$/.test(l))
  const rows: TableData['rows'] = dataLines.map((line) => ({
    _type: 'tableRow',
    _key: Math.random().toString(36).slice(2, 9),
    cells: splitRow(line),
  })).filter((r) => r.cells.some((c) => c !== ''))
  return { headers, rows }
}

function parseInput(input: string): TableData | null {
  const trimmed = input.trim()
  if (trimmed.toLowerCase().includes('<table')) return parseHtml(trimmed)
  if (trimmed.includes('\t')) return parseTsv(trimmed)
  if (trimmed.startsWith('|')) return parseMarkdown(trimmed)
  // Last resort: try TSV anyway (some plain-text tables use tabs invisibly)
  return parseTsv(trimmed)
}

export function TableBlockInput(props: ObjectInputProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleImport = useCallback(() => {
    setError('')
    if (!input.trim()) return

    const result = parseInput(input)
    if (!result || (result.headers.length === 0 && result.rows.length === 0)) {
      setError('Kunne ikke genkende tabelformatet. Prøv at kopiere tabellen igen direkte fra ChatGPT eller Word.')
      return
    }

    props.onChange(
      PatchEvent.from([
        set(result.headers, ['headers']),
        set(result.rows, ['rows']),
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
        text="📋 Importer tabel fra ChatGPT / Word / HTML"
        onClick={() => { setOpen(true); setError('') }}
      />

      {props.renderDefault(props)}

      {open && (
        <Dialog
          header="Importer tabel"
          onClose={() => { setOpen(false); setInput(''); setError('') }}
          id="html-table-import-dialog"
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1} muted>
                Kopier tabellen direkte fra ChatGPT, Word, Google Docs eller indsæt HTML — alle formater virker.
              </Text>
              <TextArea
                rows={10}
                value={input}
                onChange={(e) => setInput((e.target as HTMLTextAreaElement).value)}
                placeholder={'Indsæt tabel her…'}
              />
              {error && (
                <Card tone="critical" padding={3} radius={2}>
                  <Text size={1}>{error}</Text>
                </Card>
              )}
              <Button
                text="Konverter & indsæt tabel"
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
