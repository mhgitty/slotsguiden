import { defineField, defineType } from 'sanity'

export const hreflangGroupType = defineType({
  name: 'hreflangGroup',
  title: 'Hreflang Group',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Internal label, e.g. "Casino Reviews CA ↔ AU ↔ Global"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'script',
      title: 'Hreflang tags',
      type: 'text',
      rows: 6,
      description: 'Paste the full <link rel="alternate" hreflang="..."> block here. All tags will be injected into <head> on every assigned page.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'pages',
      title: 'Pages',
      type: 'array',
      description: 'Pick every page this hreflang group applies to.',
      of: [{
        type: 'reference',
        to: [
          { type: 'homepage' },
          { type: 'page' },
          { type: 'bookmaker' },
          { type: 'post' },
          { type: 'paymentMethod' },
          { type: 'software' },
          { type: 'casinoGame' },
        ],
      }],
    }),
  ],
  preview: {
    select: { name: 'name', pages: 'pages' },
    prepare({ name, pages }: any) {
      const count = pages?.length ?? 0
      return {
        title: name || 'Hreflang Group',
        subtitle: `${count} page${count === 1 ? '' : 's'}`,
      }
    },
  },
  orderings: [
    { title: 'Name A–Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
})
