import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// Enables Next.js Draft Mode and redirects to the requested page, which will
// then render unpublished draft content. Opened by the "Preview" button in the
// Sanity Studio: /api/preview?secret=…&slug=/online-casino/foo/
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug') || '/'

  const expected = process.env.NEXT_PUBLIC_SANITY_PREVIEW_SECRET
  if (!expected || secret !== expected) {
    return new Response('Invalid or missing preview secret', { status: 401 })
  }

  const dm = await draftMode()
  dm.enable()

  // Only allow same-origin relative paths
  const path = slug.startsWith('/') ? slug : `/${slug}`
  return NextResponse.redirect(new URL(path, req.nextUrl.origin))
}
