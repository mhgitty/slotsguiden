import { defineField, defineType } from 'sanity'
import { bodyField, introField } from './page'

export const authorType = defineType({
  name: 'author',
  title: 'Authors',
  type: 'document',
  groups: [
    { name: 'profile', title: '👤 Profile' },
    { name: 'content', title: '📝 Content' },
    { name: 'seo',     title: '🔍 SEO' },
  ],
  fields: [
    defineField({ name: 'name',     title: 'Name',       type: 'string',  group: 'profile', validation: (r) => r.required() }),
    defineField({ name: 'slug',     title: 'Slug',       type: 'slug',    group: 'profile', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'role',     title: 'Role/Title', type: 'string',  group: 'profile', description: 'E.g. "Casino Expert" or "Senior Editor"' }),
    defineField({ name: 'image',    title: 'Photo',      type: 'image',   group: 'profile', options: { hotspot: true } }),
    { ...introField, title: 'Intro / Bio', group: 'profile', description: 'Short intro paragraph shown in the hero section of the author page' } as any,
    defineField({
      name: 'education',
      title: 'Education',
      type: 'string',
      group: 'profile',
      description: 'E.g. "University of Birmingham"',
    }),
    defineField({
      name: 'expertise',
      title: 'Expertise',
      type: 'string',
      group: 'profile',
      description: 'E.g. "Casino Reviews, Bonus Analysis, Responsible Gambling"',
    }),
    defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'url', group: 'profile' }),
    defineField({ name: 'x',        title: 'X (Twitter) URL', type: 'url', group: 'profile' }),
    defineField({ name: 'facebook', title: 'Facebook URL', type: 'url', group: 'profile' }),

    // Legacy plain-text bio (kept for backward compat, used as fallback)
    defineField({ name: 'bio', title: 'Short bio (legacy)', type: 'text', rows: 3, group: 'profile', description: 'Used as fallback in the compact author card if intro is empty' }),

    // Full body content
    { ...bodyField, group: 'content' } as any,

    // SEO
    defineField({ name: 'metaTitle',       title: 'Meta title',       type: 'string',          group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3,   group: 'seo' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
})
