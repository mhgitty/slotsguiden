/**
 * Renders a JSON-LD structured data script tag.
 * Place inside the <head> via a page/layout Server Component.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
