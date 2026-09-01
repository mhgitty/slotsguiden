import { defineField, defineType } from 'sanity'
import { bodyField, introField } from './page'

const sectionIntroField = { ...introField, name: 'intro', title: 'Intro text (optional)', description: 'Rich text shown between the section title and the cards.' } as any

// ── Reusable inline section types ────────────────────────────────────────────

const sectionCasinoList = {
  type: 'object' as const,
  name: 'sectionCasinoList',
  title: '🎰 Casino List',
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string', initialValue: 'Højest rangerede casinoer' }),
    defineField({ name: 'count', title: 'Number of casinos to show', type: 'number', initialValue: 5,
      validation: (r: any) => r.min(1).max(20) }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title: `🎰 ${title || 'Casino List'}` }) },
}

const sectionReviewsArchive = {
  type: 'object' as const,
  name: 'sectionReviewsArchive',
  title: '⭐ Casino Reviews (searchable)',
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string', initialValue: 'Casinoanmeldelser' }),
    sectionIntroField,
    defineField({
      name: 'count', title: 'Max casinos to show', type: 'number', initialValue: 4,
      description: 'Fallback when no casinos are hand-picked below: shows the top-rated N. A "See all reviews" link appears when there are more.',
      validation: (r: any) => r.min(1).max(50),
    }),
    defineField({
      name: 'casinos',
      title: 'Vælg casinoer (valgfri)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'bookmaker' }] }],
      description: 'Vælg og træk i rækkefølge for at bestemme præcis hvilke casinoer der vises (og i hvilken rækkefølge). Lad stå tom for at vise de højest ratede automatisk. Søgefeltet søger altid i alle casinoer.',
    }),
  ],
  preview: {
    select: { title: 'title', count: 'count' },
    prepare: ({ title, count }: any) => ({ title: `⭐ ${title || 'Casinoanmeldelser'}`, subtitle: `Searchable · max ${count || 4}` }),
  },
}

const sectionGuidesArchive = {
  type: 'object' as const,
  name: 'sectionGuidesArchive',
  title: '📚 Casino Guides (searchable)',
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string', initialValue: 'Casinoguider' }),
    sectionIntroField,
    defineField({
      name: 'count', title: 'Max guides to show', type: 'number', initialValue: 4,
      description: 'A "See all casino guides" button is shown when there are more than this',
      validation: (r: any) => r.min(1).max(50),
    }),
  ],
  preview: {
    select: { title: 'title', count: 'count' },
    prepare: ({ title, count }: any) => ({ title: `📚 ${title || 'Casinoguider'}`, subtitle: `Searchable · max ${count || 4}` }),
  },
}

const sectionPaymentMethods = {
  type: 'object' as const,
  name: 'sectionPaymentMethods',
  title: '💳 Payment Methods Grid',
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string', initialValue: 'Betalingsmetoder' }),
    sectionIntroField,
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title: `💳 ${title || 'Betalingsmetoder'}` }) },
}

const sectionSoftware = {
  type: 'object' as const,
  name: 'sectionSoftware',
  title: '🎮 Software Providers Grid',
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string', initialValue: 'Spiludviklere' }),
    sectionIntroField,
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title: `🎮 ${title || 'Spiludviklere'}` }) },
}

const sectionCtaBanner = {
  type: 'object' as const,
  name: 'sectionCtaBanner',
  title: '📢 CTA Banner',
  fields: [
    defineField({ name: 'icon', title: 'Solar icon name (e.g. shield-check)', type: 'string' }),
    defineField({ name: 'title', title: 'Heading', type: 'string', validation: (r: any) => r.required() }),
    defineField({ name: 'body', title: 'Body text', type: 'text', rows: 3 }),
    defineField({ name: 'buttonLabel', title: 'Button label', type: 'string' }),
    defineField({ name: 'buttonUrl', title: 'Button URL', type: 'string' }),
    defineField({
      name: 'style', title: 'Style', type: 'string', initialValue: 'green',
      options: { list: [
        { title: 'Green', value: 'green' }, { title: 'Dark', value: 'dark' },
        { title: 'Purple gradient', value: 'purple' }, { title: 'Light', value: 'light' },
      ], layout: 'radio' },
    }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title: `📢 ${title || 'CTA Banner'}` }) },
}

const sectionHighlights = {
  type: 'object' as const,
  name: 'sectionHighlights',
  title: '✨ Highlight Cards',
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro text', type: 'text', rows: 2 }),
    defineField({
      name: 'items', title: 'Highlight cards', type: 'array',
      of: [{
        type: 'object', name: 'highlightItem',
        fields: [
          defineField({ name: 'title', title: 'Card title', type: 'string', validation: (r: any) => r.required() }),
          defineField({ name: 'bullets', title: 'Bullet points', type: 'array', of: [{ type: 'string' }] }),
        ],
        preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title }) },
      }],
      validation: (r: any) => r.max(4),
    }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title: `✨ ${title || 'Highlights'}` }) },
}

const sectionGameTypes = {
  type: 'object' as const,
  name: 'sectionGameTypes',
  title: '🃏 Game Types Grid',
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string' }),
    defineField({
      name: 'items', title: 'Game types', type: 'array',
      of: [{
        type: 'object', name: 'gameTypeItem',
        fields: [
          defineField({ name: 'title', title: 'Game title', type: 'string', validation: (r: any) => r.required() }),
          defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
          defineField({ name: 'icon', title: 'Solar icon name', type: 'string' }),
          defineField({ name: 'href', title: 'Link URL (optional)', type: 'string' }),
        ],
        preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title }) },
      }],
      validation: (r: any) => r.max(6),
    }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }: any) => ({ title: `🃏 ${title || 'Game Types'}` }) },
}

// ─────────────────────────────────────────────────────────────────────────────

export const homepageType = defineType({
  name: 'homepage',
  title: '🏠 Homepage',
  type: 'document',
  groups: [
    { name: 'content',  title: 'Content' },
    { name: 'sections', title: 'Sections' },
    { name: 'seo',      title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'heroHeading',
      title: 'Hero heading',
      type: 'string',
      group: 'content',
      initialValue: 'Find de bedste onlinecasinobonusser',
      description: 'Main H1 on the homepage.',
    }),
    { ...introField, title: 'Intro text', group: 'content' } as any,
    // ── Hero navigation cards ──────────────────────────────────────────────
    defineField({
      name: 'heroCards',
      title: 'Hero cards (right side)',
      type: 'array',
      group: 'content',
      description: 'Up to 4 quick-link cards shown on the right half of the hero. Each card has a title, Solar icon, and link.',
      of: [{
        type: 'object',
        name: 'heroCard',
        fields: [
          defineField({ name: 'title', title: 'Card title', type: 'string', validation: (r: any) => r.required() }),
          defineField({ name: 'icon', title: 'Solar icon name (e.g. card-bold-duotone → use "card")', type: 'string' }),
          defineField({ name: 'href', title: 'Link URL', type: 'string', validation: (r: any) => r.required() }),
        ],
        preview: {
          select: { title: 'title', href: 'href' },
          prepare: ({ title, href }: any) => ({ title: title || 'Card', subtitle: href }),
        },
      }],
      validation: (r: any) => r.max(4),
    }),
    { ...bodyField, group: 'content' } as any,
    // ── Page sections builder ──────────────────────────────────────────────
    defineField({
      name: 'sections',
      title: 'Page sections',
      type: 'array',
      group: 'sections',
      description: 'Add, remove and drag to reorder sections on the homepage. Each type has its own settings.',
      of: [
        sectionCasinoList,
        sectionReviewsArchive,
        sectionGuidesArchive,
        sectionPaymentMethods,
        sectionSoftware,
        sectionCtaBanner,
        sectionHighlights,
        sectionGameTypes,
      ],
    }),
    // ── SEO ────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle',       title: 'Meta title',       type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'featuredImage', title: 'OG image', type: 'image', group: 'seo',
      description: 'Image shown when the page is shared on social media',
      options: { hotspot: true },
      fields: [ defineField({ name: 'alt', title: 'Alt text', type: 'string' }) ],
    }),
  ],
  preview: {
    select: { title: 'heroHeading' },
    prepare({ title }) { return { title: title || 'Homepage' } },
  },
})
