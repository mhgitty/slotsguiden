import { defineField, defineType } from 'sanity'
import { bodyField, relatedPagesFields } from './page'

export const bookmakerType = defineType({
  name: 'bookmaker',
  title: 'Casino Reviews',
  type: 'document',
  groups: [
    { name: 'info', title: 'Info & bonus' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ── Identity ─────────────────────────────────────────────────────────────
    defineField({
      name: 'titel',
      title: 'Title (H1)',
      type: 'string',
      group: 'info',
      description: 'Displayed as the H1 on the review page. Falls back to "Name Review" if empty.',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'info',
      options: { source: 'name' },
      description: 'Used in URL: /review/[slug]',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: '🌍 Global', value: 'global' },
        ],
        layout: 'radio',
      },
      initialValue: 'global',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'score',
      title: 'Score (0–10)',
      type: 'number',
      group: 'info',
      description: 'Our overall rating of the casino',
      validation: (r) => r.min(0).max(10),
    }),
    defineField({
      name: 'usp',
      title: 'USP',
      type: 'string',
      group: 'info',
      description: 'Short selling point — shown on the card, e.g. "Best welcome bonus on the market"',
    }),

    // ── Bonus info ────────────────────────────────────────────────────────────
    defineField({
      name: 'indbetalingsbonus',
      title: 'Welcome bonus',
      type: 'string',
      group: 'info',
      description: 'E.g. "100% up to $1,000"',
    }),
    defineField({
      name: 'minIndbetaling',
      title: 'Minimum deposit',
      type: 'number',
      group: 'info',
    }),
    defineField({
      name: 'gennemspilskrav',
      title: 'Wager',
      type: 'string',
      group: 'info',
      description: 'E.g. "x40" or "None"',
    }),
    defineField({
      name: 'lanceringsdato',
      title: 'Established',
      type: 'string',
      group: 'info',
      description: 'E.g. "2012" or "2005"',
    }),
    defineField({
      name: 'license',
      title: 'License',
      type: 'string',
      group: 'info',
      description: 'E.g. "Curacao", "MGA", "UKGC"',
    }),
    defineField({
      name: 'url',
      title: 'Affiliate URL',
      type: 'url',
      group: 'info',
      description: 'Link used in the "Sign Up" button',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'terms',
      title: 'Terms',
      type: 'text',
      rows: 2,
      group: 'info',
      description: 'Short terms text — shown below bonus details',
    }),

    // ── Page content ──────────────────────────────────────────────────────────
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),

    // ── Payment Methods & Software ────────────────────────────────────────────
    defineField({
      name: 'paymentMethods',
      title: 'Payment Methods',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'paymentMethod' }] }],
      description: 'Payment methods accepted by this casino',
    }),
    defineField({
      name: 'software',
      title: 'Software Providers',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'software' }] }],
      description: 'Game software providers used by this casino',
    }),

    // ── SEO ───────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      group: 'seo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'usp', media: 'logo' },
  },
})
