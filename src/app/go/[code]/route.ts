import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET(
  _req: NextRequest,
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

  return NextResponse.redirect(redirect.destination, 302)
}
