import { defineField, defineType } from 'sanity'
import { bodyField, relatedPagesFields } from './page'

export const bonusType = defineType({
  name: 'bonus',
  title: 'Bonuses',
  type: 'document',
  groups: [
    { name: 'info',    title: '🎁 Bonus info' },
    { name: 'details', title: '📋 Details' },
    { name: 'content', title: '📝 Content' },
    { name: 'seo',     title: '🔍 SEO' },
  ],
  fields: [
    // ── Identity ─────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'info',
      options: { source: 'title' },
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

    // ── Active ────────────────────────────────────────────────────────────────
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'info',
      description: 'Only active bonuses are shown in comparison lists',
      initialValue: false,
    }),

    // ── Bookmaker relation ────────────────────────────────────────────────────
    defineField({
      name: 'bookmaker',
      title: 'Casino',
      type: 'reference',
      group: 'info',
      to: [{ type: 'bookmaker' }],
      description: 'Which casino does this bonus belong to?',
    }),

    // ── Core bonus fields ─────────────────────────────────────────────────────
    defineField({
      name: 'casinoNavn',
      title: 'Casino name',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'casinoLogo',
      title: 'Casino logo',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'casinoLogoSquare',
      title: 'Casino logo square',
      type: 'image',
      group: 'info',
      description: 'Square version of the casino logo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'oddsBonusTitel',
      title: 'Bonus title',
      type: 'string',
      group: 'info',
      description: 'E.g. "Get $500 free bet" — shown on the comparison card',
    }),
    defineField({
      name: 'offerUrl',
      title: 'Offer URL',
      type: 'url',
      group: 'info',
      description: 'Affiliate link to the bonus offer',
    }),
    defineField({
      name: 'minimumOdds',
      title: 'Minimum odds',
      type: 'string',
      group: 'info',
      description: 'E.g. "1.70"',
    }),

    // ── Bonus details ─────────────────────────────────────────────────────────
    defineField({
      name: 'minimumIndbetaling',
      title: 'Minimum deposit',
      type: 'number',
      group: 'details',
    }),
    defineField({
      name: 'gennemspilskrav',
      title: 'Wager requirement',
      type: 'string',
      group: 'details',
      description: 'E.g. "x10" or "None"',
    }),
    defineField({
      name: 'spinVaerdi',
      title: 'Spin value',
      type: 'string',
      group: 'details',
      description: 'E.g. "$0.10 per spin"',
    }),
    defineField({
      name: 'maksGevinst',
      title: 'Max winnings',
      type: 'string',
      group: 'details',
      description: 'E.g. "$500" or "Unlimited"',
    }),
    defineField({
      name: 'terms',
      title: 'Terms and conditions',
      type: 'text',
      rows: 3,
      group: 'details',
    }),
    defineField({
      name: 'bonuskode',
      title: 'Bonus code',
      type: 'string',
      group: 'details',
    }),

    // ── Campaign ──────────────────────────────────────────────────────────────
    defineField({
      name: 'kampagneBillede',
      title: 'Campaign image',
      type: 'image',
      group: 'details',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'kampagneStart',
      title: 'Campaign start',
      type: 'datetime',
      group: 'details',
    }),
    defineField({
      name: 'kampagneSlut',
      title: 'Campaign end',
      type: 'datetime',
      group: 'details',
    }),

    // ── Page content ──────────────────────────────────────────────────────────
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),

    // ── SEO ───────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle',       title: 'Meta title',       type: 'string',             group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3,      group: 'seo' }),
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
    select: {
      title:    'title',
      subtitle: 'casinoNavn',
      media:    'casinoLogo',
    },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle || '', media }
    },
  },
})
