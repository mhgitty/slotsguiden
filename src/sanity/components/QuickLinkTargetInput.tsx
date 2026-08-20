'use client'
import { useFormValue, set, unset, type StringInputProps } from 'sanity'
import { Select } from '@sanity/ui'
import { useCallback } from 'react'

/** Pull the plain text of every H2 block from a Portable Text body. */
function extractH2Headings(body: unknown): string[] {
  if (!Array.isArray(body)) return []
  const out: string[] = []
  for (const block of body as any[]) {
    if (block?._type === 'block' && block?.style === 'h2') {
      const text = (block.children || []).map((c: any) => c?.text || '').join('').trim()
      if (text) out.push(text)
    }
  }
  // De-dupe while preserving order.
  return Array.from(new Set(out))
}

/**
 * String input that offers a dropdown of the current document's H2 headings.
 * Used for the "target heading" of a custom hero quick link.
 */
export function QuickLinkTargetInput(props: StringInputProps) {
  const { value, onChange, elementProps } = props
  const body = useFormValue(['body'])
  const headings = extractH2Headings(body)

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.currentTarget.value
      onChange(next ? set(next) : unset())
    },
    [onChange]
  )

  // If the stored value no longer matches a current heading, keep it selectable
  // so the editor can see it's stale rather than silently dropping it.
  const options = value && !headings.includes(value) ? [value, ...headings] : headings

  return (
    <Select {...elementProps} value={value || ''} onChange={handleChange}>
      <option value="">
        {headings.length ? '— Vælg en H2-overskrift fra brødteksten —' : '— Ingen H2-overskrifter i brødteksten endnu —'}
      </option>
      {options.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </Select>
  )
}
