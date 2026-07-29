import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { HeroSection } from '@/components/HeroSection'
import { AuthorBar } from '@/components/AuthorBar'
import { AuthorBio } from '@/components/AuthorBio'
import { ComparisonTable } from '@/components/ComparisonTable'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { AuthorMeta } from '@/components/AuthorMeta'
import { JsonLd } from '@/components/JsonLd'
import { HreflangLinks } from '@/components/HreflangLinks'
import { RelatedPages } from '@/components/RelatedPages'
import { BonusGrid } from '@/components/BonusGrid'
import { getPostBySlug, getPageByPath, getPosts, getSiteSettings, client } from '@/lib/sanity'
import { replaceDateVars, blocksToPlainText } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

const BASE = 'https://slotsguiden.dk'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const [posts, pages] = await Promise.all([
    client.fetch<Array<{ slug: { current: string } }>>(
      `*[_type == "post" && defined(slug.current) && defined(publishedAt)] { slug }`
    ).catch(() => []),
    client.fetch<Array<{ slug: { current: string } }>>(
      `*[_type == "page" && defined(slug.current) && !defined(parent)] { slug }`
    ).catch(() => []),
  ])
  const slugs = new Set([
    ...posts.map((p) => p.slug.current),
    ...pages.map((p) => p.slug.current),
  ])
  return Array.from(slugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await getPostBySlug(slug).catch(() => null)
  if (post) {
    const title = replaceDateVars(post.metaTitle || post.title)
    const description = replaceDateVars(post.metaDescription || post.excerpt || '')
    const canonical = `${BASE}/${slug}/`
    const img = post.ogImage?.url ? post.ogImage : post.featuredImage?.url ? post.featuredImage : null
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title, description, url: canonical, type: 'article',
        publishedTime: post.publishedAt,
        modifiedTime: post.lastUpdated || post.publishedAt,
        authors: post.author?.name ? [post.author.name] : undefined,
        ...(img ? { images: [{ url: img.url, alt: img.alt || title }] } : {}),
      },
      twitter: {
        title, description,
        ...(img ? { images: [img.url] } : {}),
      },
    }
  }

  const page = await getPageByPath([slug]).catch(() => null)
  if (page) {
    const title = replaceDateVars(page.metaTitle || page.title)
    const description = replaceDateVars(page.metaDescription || blocksToPlainText(page.intro))
    const canonical = `${BASE}/${slug}/`
    return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical } }
  }

  return {}
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params

  // ── Try post first ───────────────────────────────────────────────────────
  const [post, latestPosts, settings] = await Promise.all([
    getPostBySlug(slug).catch(() => null),
    getPosts(6),
    getSiteSettings().catch(() => null),
  ])

  if (post) {
    const author = post.author ?? settings?.defaultAuthor ?? null
    const canonical = `${BASE}/${slug}/`

    const jsonLdGraph: object[] = [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: BASE },
          { '@type': 'ListItem', position: 2, name: post.title, item: canonical },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: post.title,
        description: post.excerpt || '',
        url: canonical,
        datePublished: post.publishedAt,
        dateModified: post.lastUpdated || post.publishedAt,
        inLanguage: 'da-DK',
        author: author
          ? {
              '@type': 'Person',
              name: author.name,
              ...(author.linkedin || author.x ? {
                sameAs: [author.linkedin, author.x].filter(Boolean),
              } : {}),
            }
          : { '@type': 'Organization', name: 'Slotsguiden' },
        publisher: {
          '@type': 'Organization',
          name: 'Slotsguiden',
          url: BASE,
          logo: { '@type': 'ImageObject', url: `${BASE}/logo.webp` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        ...(post.featuredImage?.url ? { image: post.featuredImage.url } : {}),
      },
    ]

    return (
      <>
        <JsonLd data={{ '@context': 'https://schema.org', '@graph': jsonLdGraph }} />
        <HreflangLinks docId={(post as any)._id} />
        <Navbar />

        <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border)', padding: '40px 15px 32px' }}>
          <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
            <Breadcrumbs crumbs={[
              { label: 'Hjem', href: '/' },
              { label: post.title },
            ]} />
            {post.category && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(28,127,192,0.1)', color: 'var(--green)', fontSize: '12px', fontWeight: 500, padding: '3px 12px', borderRadius: '20px', marginBottom: '16px' }}>
                {post.category.emoji} {post.category.name}
              </div>
            )}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: author ? '20px' : '16px', maxWidth: '720px' }}>
              {replaceDateVars(post.title)}
            </h1>
            <AuthorBar author={author} updatedAt={post.lastUpdated || post.publishedAt} />
            {post.excerpt && <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '640px' }}>{replaceDateVars(post.excerpt)}</p>}
          </div>
        </div>

        <div className="article-layout">
          <article className="article-content">
            {post.body && <MobileToc body={post.body} />}
            {post.body && <PortableTextRenderer value={post.body} posts={latestPosts} />}
            {author && <AuthorBio author={author} />}
          </article>
          {post.body && (
            <aside className="toc-sidebar">
              <TableOfContents body={post.body} />
            </aside>
          )}
        </div>

        <Footer />
        <RelatedPages docId={post?._id} />
      </>
    )
  }

  // ── Fall back to page ────────────────────────────────────────────────────
  const page = await getPageByPath([slug]).catch(() => null)
  if (!page) notFound()

  const hideAuthor = (page as any).hideAuthor ?? false
  const author = hideAuthor ? null : (page.author ?? settings?.defaultAuthor ?? null)
  const canonical = `${BASE}/${slug}/`

  const breadcrumbItems = [{ name: 'Hjem', item: BASE }]
  if (page.parentSlug && page.parentTitle) {
    breadcrumbItems.push({ name: page.parentTitle, item: `${BASE}/${page.parentSlug}/` })
  }
  breadcrumbItems.push({ name: page.title, item: canonical })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, i) => ({
          '@type': 'ListItem', position: i + 1, name: item.name, item: item.item,
        })),
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: blocksToPlainText(page.intro),
        inLanguage: 'da-DK',
        publisher: { '@type': 'Organization', name: 'Slotsguiden', url: BASE },
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <HreflangLinks docId={(page as any)._id} />
      <Navbar />
      <HeroSection
        title={page.title}
        intro={page.intro}
        author={author}
        factChecker={page.factChecker}
        updatedAt={page.lastUpdated}
        breadcrumbs={[
          { label: 'Hjem', href: '/' },
          ...(page.parentSlug && page.parentTitle
            ? [{ label: page.parentTitle, href: `/${page.parentSlug}` }]
            : []),
          { label: page.title },
        ]}
      />

      {page.showBonusGrid && <BonusGrid title={page.bonusGridTitle} />}

      {page.showComparisonTable && page.comparisonTable && (
        <div className="section" style={{ paddingBottom: page.body ? '0' : undefined }}>
          {page.comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {page.comparisonTableTitle}
            </h2>
          )}
          <ComparisonTable data={page.comparisonTable} />
        </div>
      )}

      {page.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={page.body} />
            <PortableTextRenderer value={page.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={page.body} />
          </aside>
        </div>
      )}

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}

      <Footer />
      <RelatedPages docId={page?._id} />
    </>
  )
}
