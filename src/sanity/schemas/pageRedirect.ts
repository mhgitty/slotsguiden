import { defineField, defineType } from 'sanity'

export const pageRedirectType = defineType({
  name: 'pageRedirect',
  title: '301 Redirect',
  type: 'document',
  fields: [
    defineField({
      name: 'from',
      title: 'From path',
      type: 'string',
      description: 'The old URL path, including leading slash. E.g. /old-page/ or /old-section/old-slug/',
      validation: (r) =>
        r.required().custom((value: string | undefined) => {
          if (!value) return true
          if (!value.startsWith('/')) return 'Path must start with /'
          return true
        }),
    }),
    defineField({
      name: 'to',
      title: 'To path',
      type: 'string',
      description: 'Destination path or full URL. E.g. /new-page/ or https://example.com/',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Disable to pause the redirect without deleting it',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description: 'Optional: why this redirect exists, e.g. "Slug changed from /old to /new on 2026-05"',
    }),
  ],
  preview: {
    select: { from: 'from', to: 'to', active: 'active' },
    prepare({ from, to, active }: any) {
      return {
        title: `${active === false ? '[off] ' : ''}${from || '(no path)'}`,
        subtitle: `→ ${to || '(no destination)'}`,
      }
    },
  },
  orderings: [
    { title: 'From path A–Z', name: 'fromAsc', by: [{ field: 'from', direction: 'asc' }] },
  ],
})
