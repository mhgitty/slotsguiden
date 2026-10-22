import { defineField, defineType } from 'sanity'

export const categoryType = defineType({
  name: 'category',
  title: 'Kategorier',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Navn', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'emoji', title: 'Emoji', type: 'string', description: 'F.eks. ⚡ 🌿 💡' }),
    defineField({ name: 'description', title: 'Beskrivelse', type: 'text', rows: 2 }),
    defineField({
      name: 'isNews', title: 'Nyhedskategori (Google News)', type: 'boolean', initialValue: false,
      description: 'Posts in this category get NewsArticle schema and are listed in the Google News sitemap. "Nyheder" counts as news automatically.',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'description' },
  },
})
