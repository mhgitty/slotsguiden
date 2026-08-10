import { defineField, defineType } from 'sanity'
import { bodyField, introField, relatedPagesFields } from './page'

export const spillemaskineType = defineType({
  name: 'spillemaskine',
  title: 'Online Spillemaskiner',
  type: 'document',
  groups: [
    { name: 'info', title: 'Info' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'titel',
      title: 'Title (H1)',
      type: 'string',
      group: 'info',
      description: 'Displayed as the H1 on the page. Falls back to Name if empty.',
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
      description: 'Used in URL: /online-spillemaskiner/[slug]',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
      group: 'info',
      options: { list: [{ title: '🌍 Global', value: 'global' }], layout: 'radio' },
      initialValue: 'global',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured image',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({ name: 'publishedAt', title: 'Published date', type: 'datetime', group: 'info' }),
    defineField({ name: 'lastUpdated', title: 'Last updated', type: 'datetime', group: 'info' }),

    { ...introField, group: 'content' } as any,
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),

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
  preview: { select: { title: 'name', subtitle: 'titel', media: 'featuredImage' } },
})
