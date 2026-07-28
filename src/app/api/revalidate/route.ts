import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const type = body?._type as string | undefined
    const slug = body?.slug?.current as string | undefined

    // Always bust the full layout — guarantees every page is fresh.
    // Also revalidate specific paths so ISR picks them up immediately.
    revalidatePath('/', 'layout')

    const specific: string[] = []

    if (type === 'post') {
      revalidatePath('/blog/[slug]', 'page')
      if (slug) { revalidatePath(`/blog/${slug}/`, 'page'); specific.push(`/blog/${slug}/`) }
    } else if (type === 'bookmaker') {
      revalidatePath('/review/[slug]', 'page')
      if (slug) { revalidatePath(`/review/${slug}/`, 'page'); specific.push(`/review/${slug}/`) }
    }

    return NextResponse.json({
      revalidated: true,
      type: type ?? 'unknown',
      slug: slug ?? null,
      layout: '/',
      specific,
      ts: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ message: 'Revalidation failed', error: String(err) }, { status: 500 })
  }
}
