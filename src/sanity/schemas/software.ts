import { defineField, defineType } from 'sanity'
import { bodyField, relatedPagesFields } from './page'
import { comparisonTableFields } from './comparisonTable'

export const softwareType = defineType({
  name: 'software',
  title: 'Software',
  type: 'document',
  groups: [
    { name: 'general',  title: '⚙️ General' },
    { name: 'stats',    title: '📊 Stats' },
    { name: 'content',  title: '📝 Content' },
    { name: 'seo',      title: '🔍 SEO' },
  ],
  fields: [
    // ── Identity ────────────────────────────────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'general',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'titel',
      title: 'H1',
      type: 'string',
      group: 'general',
      description: 'Displayed as the H1 heading on the page. Falls back to Name if empty.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'general',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
      group: 'general',
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
      group: 'general',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),

    // ── Casinos relationship ─────────────────────────────────────────────────────
    defineField({
      name: 'showCasinoComparison',
      title: 'Vis sammenligningsliste',
      type: 'boolean',
      group: 'general',
      description: 'Vis automatisk en sammenligningsliste med casinoer, der bruger denne spiludvikler.',
      initialValue: true,
    }),
    defineField({
      name: 'comparisonTitle',
      title: 'Sammenligningsliste — titel',
      type: 'string',
      group: 'general',
      description: 'Overskrift vist over sammenligningslisten. Efterlad tom for at bruge "Bedste casinoer med [navn]".',
    }),
    defineField({
      name: 'casinos',
      title: 'Casinoer i sammenligningslisten',
      type: 'array',
      group: 'general',
      description: 'Casinoer, der bruger denne spiludvikler, vises automatisk. Træk for at ændre rækkefølgen. Nye casinoer, der tilføjer denne spiludvikler, tilføjes automatisk nederst.',
      of: [{ type: 'reference', to: [{ type: 'bookmaker' }] }],
    }),

    // ── Stats ───────────────────────────────────────────────────────────────────
    defineField({
      name: 'rtp',
      title: 'RTP',
      type: 'string',
      group: 'stats',
      description: 'e.g. "94–98%"',
    }),
    defineField({
      name: 'amountOfSlots',
      title: 'Amount of Slots',
      type: 'string',
      group: 'stats',
      description: 'e.g. "200+" or "500"',
    }),
    defineField({
      name: 'licenses',
      title: 'Licenses',
      type: 'string',
      group: 'stats',
      description: 'e.g. "MGA, UKGC, Curaçao"',
    }),
    defineField({
      name: 'gameCategories',
      title: 'Game Categories',
      type: 'string',
      group: 'stats',
      description: 'e.g. "Slots, Live Casino, Table Games"',
    }),
    defineField({
      name: 'highestRtpSlot',
      title: 'Highest RTP Slot',
      type: 'string',
      group: 'stats',
      description: 'e.g. "Mega Joker (99%)"',
    }),
    defineField({
      name: 'bonusBuys',
      title: 'Bonus Buys',
      type: 'string',
      group: 'stats',
      description: 'e.g. "Yes" / "No" / "Available in most markets"',
    }),

    // ── Content ─────────────────────────────────────────────────────────────────
    { ...bodyField, title: 'Intro', name: 'intro', group: 'content' } as any,
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),
    ...comparisonTableFields.map(fld => ({ ...fld, group: 'content' })) as any,

    // ── SEO ─────────────────────────────────────────────────────────────────────
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      group: 'seo',
      description: 'SEO title tag. Max 60 characters.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'string',
      group: 'seo',
      description: 'SEO meta description. 140–155 characters.',
    }),
    defineField({
      name: 'ogImage',
      title: 'OG Image',
      type: 'image',
      group: 'seo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  preview: {
    select: { title: 'name', media: 'logo' },
    prepare({ title, media }: any) {
      return { title, media }
    },
  },
})
