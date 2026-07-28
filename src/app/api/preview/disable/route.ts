import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// Exits Draft Mode (called by the "Exit preview" banner button).
export async function GET(req: NextRequest) {
  const dm = await draftMode()
  dm.disable()
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug') || '/'
  const path = slug.startsWith('/') ? slug : `/${slug}`
  return NextResponse.redirect(new URL(path, req.nextUrl.origin))
}
