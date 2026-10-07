import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { buildRedirectDestination } from '@/lib/redirectDestination'

// Affiliate tracking redirect: /CODE → destination (302), forwarding any
// incoming query params (e.g. ?placement=/page/) onto the destination URL.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const redirect = await client.fetch<{ destination: string; active: boolean } | null>(
    `*[_type == "redirect" && code.current == $code && (market == "global" || !defined(market))][0] { destination, active }`,
    { code },
    { next: { revalidate: 60 } }
  )

  if (!redirect || !redirect.active) {
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slotsguiden.dk'), 302)
  }

  return NextResponse.redirect(buildRedirectDestination(redirect.destination, req), 302)
}
