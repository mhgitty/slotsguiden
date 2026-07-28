import { getHreflangScript } from '@/lib/sanity'
import { HreflangHead } from './HreflangHead'

/**
 * HreflangLinks — async server component.
 *
 * One-liner for any page that renders a Sanity document: fetches the
 * hreflang script for the given document id and renders the <link> tags
 * (hoisted into <head> by React 19). Renders nothing when the document is
 * not part of any hreflang group.
 *
 *   <HreflangLinks docId={(doc as any)._id} />
 */
export async function HreflangLinks({ docId }: { docId?: string | null }) {
  if (!docId) return null
  const script = await getHreflangScript(docId).catch(() => null)
  return <HreflangHead script={script} />
}
