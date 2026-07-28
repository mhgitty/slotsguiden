export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-æøå]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
