import { defineField, defineType } from 'sanity'
import { bodyField, relatedPagesFields } from './page'
import { comparisonTableFields } from './comparisonTable'

export const paymentMethodType = defineType({
  name: 'paymentMethod',
  title: 'Payment Methods',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'titel',
      title: 'H1',
      type: 'string',
      description: 'Displayed as the H1 heading on the page. Falls back to Name if empty.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
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
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'paymentCategory',
      title: 'Payment Category',
      type: 'string',
      description: 'e.g. "E-wallet", "Bank Transfer", "Cryptocurrency"',
    }),
    { ...bodyField, title: 'Intro', name: 'intro' } as any,
    defineField({
      name: 'withdrawalTime',
      title: 'Withdrawal Time',
      type: 'string',
      description: 'e.g. "Instant", "1–3 business days"',
    }),
    defineField({
      name: 'transactionFees',
      title: 'Transaction Fees',
      type: 'string',
      description: 'e.g. "Free", "1.5% per transaction"',
    }),
    defineField({
      name: 'eligibleForBonuses',
      title: 'Eligible for Bonuses',
      type: 'string',
      description: 'e.g. "Yes", "No", "Depends on the casino"',
    }),
    { ...bodyField } as any,
    ...relatedPagesFields,
    ...comparisonTableFields,
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'SEO title tag. Max 60 characters.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'string',
      description: 'SEO meta description. 140–155 characters.',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'paymentCategory', media: 'logo' },
  },
})
