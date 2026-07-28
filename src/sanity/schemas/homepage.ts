import { defineField, defineType } from 'sanity'
import { bodyField, introField } from './page'
import { comparisonTableFields } from './comparisonTable'

export const homepageType = defineType({
  name: 'homepage',
  title: '🏠 Homepage',
  type: 'document',
  groups: [
    { name: 'hero',    title: 'Hero' },
    { name: 'content', title: 'Content' },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    // Hero
    defineField({
      name: 'heroHeading',
      title: 'Hero heading',
      type: 'string',
      group: 'hero',
      initialValue: 'Find the best online casino bonus',
    }),
    { ...introField, title: 'Intro', group: 'hero', description: 'Short text below the heading in the hero section' } as any,

    // Comparison table (renders above body text)
    ...comparisonTableFields.map(f => ({ ...f, group: 'content' })) as any,

    // Body content
    { ...bodyField, group: 'content' } as any,

    defineField({
      name: 'howItWorksTitle',
      title: 'Section title',
      type: 'string',
      group: 'content',
      initialValue: 'How It Works',
    }),
    defineField({
      name: 'howItWorksItems',
      title: 'Steps',
      type: 'array',
      group: 'content',
      of: [{
        type: 'object',
        name: 'howItWorksItem',
        title: 'Step',
        fields: [
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'body',  title: 'Body text', type: 'text', rows: 4 },
        ],
        preview: {
          select: { title: 'title', subtitle: 'body' },
        },
      }],
    }),

    // ── Section headings ───────────────────────────────────────────────────
    defineField({ name: 'latestSectionTitle',    title: 'Latest section heading',          type: 'string', group: 'content', initialValue: 'Latest' }),
    defineField({ name: 'casinoReviewsTitle',    title: 'Casino reviews table heading',    type: 'string', group: 'content', initialValue: 'Top Casino Reviews' }),
    defineField({ name: 'topRatedTitle',         title: 'Top rated table heading',         type: 'string', group: 'content', initialValue: 'Top Rated Casinos' }),
    defineField({ name: 'featuredSectionTitle',  title: 'Featured section heading',        type: 'string', group: 'content', initialValue: 'Featured' }),

    // ── Trust section ──────────────────────────────────────────────────────
    defineField({
      name: 'trustItems',
      title: 'Trust items',
      type: 'array',
      group: 'content',
      description: 'Three trust/USP cards shown at the bottom of the homepage. Each uses a Solar icon.',
      of: [{
        type: 'object',
        name: 'trustItem',
        title: 'Trust item',
        fields: [
          defineField({ name: 'icon',  title: 'Solar icon name (e.g. "shield-check")', type: 'string' }),
          defineField({ name: 'title', title: 'Title', type: 'string', validation: (r: any) => r.required() }),
          defineField({ name: 'body',  title: 'Body text', type: 'text', rows: 3, validation: (r: any) => r.required() }),
        ],
        preview: {
          select: { title: 'title', subtitle: 'body' },
          prepare: ({ title, subtitle }: any) => ({ title: title || 'Trust item', subtitle }),
        },
      }],
      validation: (r: any) => r.max(3),
    }),

    // SEO
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo', initialValue: 'Best Online Casinos — Compare bonuses and reviews' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo', initialValue: 'Find and compare the best casino bonuses from all major online casinos.' }),
    defineField({
      name: 'featuredImage', title: 'OG image', type: 'image', group: 'seo',
      description: 'Image shown when the page is shared on social media',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'heroHeading' },
    prepare({ title }) {
      return { title: title || 'Homepage' }
    },
  },
})
