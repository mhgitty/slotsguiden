import { defineField } from 'sanity'
import { QuickLinkTargetInput } from '../components/QuickLinkTargetInput'

/**
 * Custom hero "Quick links" — editor-defined buttons under the hero intro that
 * scroll to a chosen H2 heading in the page body. Drop into any page-like schema.
 */
export const customQuickLinksField = defineField({
  name: 'customQuickLinks',
  title: 'Ekstra Quick links (til H2-overskrifter)',
  type: 'array',
  description: 'Ekstra knapper i hero der scroller ned til en valgt H2-overskrift i brødteksten.',
  of: [
    {
      type: 'object',
      name: 'customQuickLink',
      title: 'Quick link',
      fields: [
        defineField({
          name: 'label',
          title: 'Knaptekst',
          type: 'string',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'targetHeading',
          title: 'Gå til overskrift (H2)',
          type: 'string',
          components: { input: QuickLinkTargetInput },
          validation: (r) => r.required(),
        }),
      ],
      preview: {
        select: { title: 'label', subtitle: 'targetHeading' },
        prepare({ title, subtitle }: any) {
          return { title: title || '(ingen tekst)', subtitle: subtitle ? `→ ${subtitle}` : '→ (ingen overskrift valgt)' }
        },
      },
    },
  ],
})
