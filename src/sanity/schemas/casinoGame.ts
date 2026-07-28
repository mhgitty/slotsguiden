import { defineField, defineType } from 'sanity'
import { bodyField } from './page'

export const casinoGameType = defineType({
  name: 'casinoGame',
  title: 'Casino Games',
  type: 'document',
  groups: [
    { name: 'general', title: '⚙️ General' },
    { name: 'content', title: '📝 Content' },
    { name: 'seo',     title: '🔍 SEO' },
  ],
  fields: [
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
      name: 'casinos',
      title: 'Casino Reviews',
      type: 'array',
      group: 'general',
      description: 'Casinos where players can play this game.',
      of: [{ type: 'reference', to: [{ type: 'bookmaker' }] }],
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
    defineField({
      name: 'ogImage',
      title: 'OG Image',
      type: 'image',
      group: 'general',
      description: 'Used for social sharing previews.',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
    { ...bodyField, title: 'Intro', name: 'intro', group: 'content' } as any,
    { ...bodyField, group: 'content' } as any,
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
  ],
  preview: {
    select: { title: 'name', media: 'ogImage' },
    prepare({ title, media }: any) {
      return { title, media }
    },
  },
})
