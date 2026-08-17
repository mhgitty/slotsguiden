import { permanentRedirect } from 'next/navigation'

interface Props { params: Promise<{ slug: string }> }

export default async function CasinoGuideRedirect({ params }: Props) {
  const { slug } = await params
  permanentRedirect(`/guides/${slug}/`)
}
