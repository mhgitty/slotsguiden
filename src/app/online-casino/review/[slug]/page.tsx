import { permanentRedirect } from 'next/navigation'
export default async function OnlineCasinoReviewSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  permanentRedirect(`/review/${slug}/`)
}
