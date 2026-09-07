import { permanentRedirect } from 'next/navigation'

// The author archive moved from /author/[slug] to /redaktion/[slug].
// Keep this route as a permanent (301) redirect so old links still resolve.
export default async function AuthorRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  permanentRedirect(`/redaktion/${slug}/`)
}
