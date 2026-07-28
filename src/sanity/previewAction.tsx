import { useEffect, useState } from 'react'
import { EarthGlobeIcon } from '@sanity/icons'
import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { useClient } from 'sanity'

const BASE = 'https://slotsguiden.dk'

export const previewAction: DocumentActionComponent = (
  props: DocumentActionProps
) => {
  const doc = (props.draft ?? props.published ?? {}) as Record<string, any>
  const client = useClient({ apiVersion: '2026-04-22' })

  // Resolve full ancestor chain for page preview URLs
  const docId = (doc?._id as string | undefined)?.replace(/^drafts\./, '')
  const [ancestorPath, setAncestorPath] = useState('')

  useEffect(() => {
    if (props.type !== 'page' || !docId) { setAncestorPath(''); return }
    client
      .fetch<{ a1?: string; a2?: string; a3?: string; a4?: string } | null>(
        `*[_id == $id || _id == "drafts." + $id][0] {
          "a1": parent->slug.current,
          "a2": parent->parent->slug.current,
          "a3": parent->parent->parent->slug.current,
          "a4": parent->parent->parent->parent->slug.current
        }`,
        { id: docId }
      )
      .then((r) => {
        if (!r) { setAncestorPath(''); return }
        const parts = [r.a4, r.a3, r.a2, r.a1].filter(Boolean) as string[]
        setAncestorPath(parts.length > 0 ? parts.join('/') + '/' : '')
      })
      .catch(() => setAncestorPath(''))
  }, [docId, props.type, client])

  const slug = doc?.slug?.current as string | undefined

  let url: string | null = null

  switch (props.type) {
    case 'homepage':
      url = `${BASE}/`
      break
    case 'post':
      url = slug ? `${BASE}/${slug}/` : `${BASE}/`
      break
    case 'page':
      if (slug) url = `${BASE}/${ancestorPath}${slug}/`
      break
    case 'bookmaker':
      url = slug ? `${BASE}/review/${slug}/` : `${BASE}/review/`
      break
    case 'bonus':
      url = slug ? `${BASE}/online-casino/bonus/${slug}/` : `${BASE}/online-casino/bonus/`
      break
    case 'paymentMethod':
      url = slug ? `${BASE}/online-casino/payment/${slug}/` : `${BASE}/online-casino/payment/`
      break
    case 'software':
      url = slug
        ? `${BASE}/online-casino/software/${slug}/`
        : `${BASE}/online-casino/software/`
      break
    case 'casinoGame':
      url = slug ? `${BASE}/casino-games/${slug}/` : `${BASE}/casino-games/`
      break
    case 'casinoGuide':
      url = slug ? `${BASE}/casino-guides/${slug}/` : `${BASE}/casino-guides/`
      break
    default:
      url = null
  }

  if (!url) return null

  return {
    label: 'Förhandsvisning',
    icon: EarthGlobeIcon,
    tone: 'default' as const,
    onHandle: () => {
      // Open the page in Draft Mode so unpublished changes are visible.
      // Falls back to the live published page if no preview secret is set.
      const secret = process.env.NEXT_PUBLIC_SANITY_PREVIEW_SECRET
      const path = url!.replace(BASE, '')
      const target = secret
        ? `${BASE}/api/preview?secret=${encodeURIComponent(secret)}&slug=${encodeURIComponent(path)}`
        : url!
      window.open(target, '_blank', 'noopener,noreferrer')
    },
  }
}
