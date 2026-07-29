import { defineField, defineType, type SlugIsUniqueValidator } from 'sanity'

/**
 * Slug uniqueness scoped per market.
 * The same slug (e.g. "online-casino") can exist once in global, once in ca, once in au.
 */
const isSlugUniquePerMarket: SlugIsUniqueValidator = async (slug, context) => {
  const { document, getClient } = context
  const client = getClient({ apiVersion: '2026-04-22' })
  const market = (document as any)?.market || 'global'
  const docId = (document as any)?._id?.replace(/^drafts\./, '') ?? ''

  const existingId = await client.fetch<string | null>(
    `*[_type == "page" && slug.current == $slug && market == $market && _id != $id && !(_id in path("drafts.**"))][0]._id`,
    { slug, market, id: docId }
  )
  return existingId === null
}
import { TableBlockInput } from '../components/TableBlockInput'
import { FaqBlockInput } from '../components/FaqBlockInput'
import { ProsConsBlockInput } from '../components/ProsConsBlockInput'
import { comparisonTableFields } from './comparisonTable'

// Minimal rich-text field for intro/lead text — supports inline formatting + links only
export const introField = defineField({
  name: 'intro',
  title: 'Intro text',
  type: 'array',
  of: [{
    type: 'block',
    styles: [{ title: 'Normal', value: 'normal' }],
    lists: [],
    marks: {
      decorators: [
        { title: 'Bold',   value: 'strong' },
        { title: 'Italic', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            { name: 'href',     type: 'url',     title: 'URL',
              validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }) },
            { name: 'blank',    type: 'boolean', title: 'Open in new tab', initialValue: false },
            { name: 'nofollow', type: 'boolean', title: 'Nofollow',        initialValue: false },
          ],
        },
      ],
    },
  }],
})

// ── Related pages (bottom of page) ────────────────────────────────────────────
// Shared by every content type that renders a "Related pages" block.
export const relatedPagesFields = [
  defineField({
    name: 'relatedTitle',
    title: 'Related pages heading (optional)',
    type: 'string',
    description: 'Overrides the site-wide default heading for this page only',
  }),
  defineField({
    name: 'relatedPages',
    title: 'Related pages',
    type: 'array',
    description: 'Pick the pages to link to at the bottom. Nothing is shown unless you add them here.',
    of: [{
      type: 'object',
      name: 'relatedPageItem',
      fields: [
        {
          name: 'page',
          title: 'Page',
          type: 'reference',
          to: [
            { type: 'page' }, { type: 'casinoGuide' }, { type: 'bookmaker' },
            { type: 'bonus' }, { type: 'paymentMethod' }, { type: 'software' },
          ],
          validation: (r: any) => r.required(),
        },
        {
          name: 'label',
          title: 'Link text (optional)',
          type: 'string',
          description: 'What the link says on the frontend. Leave empty to use the page title.',
        },
      ],
      preview: {
        select: { label: 'label', title: 'page.title', name: 'page.name' },
        prepare({ label, title, name }: any) {
          const target = title || name || 'Page'
          return { title: label || target, subtitle: label ? target : undefined }
        },
      },
    }],
  }),
]

export const bodyField = defineField({
  name: 'body',
  title: 'Content',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              { name: 'href',     type: 'url',     title: 'URL' },
              { name: 'blank',    type: 'boolean', title: 'Open in new tab', initialValue: false },
              { name: 'nofollow', type: 'boolean', title: 'Nofollow (rel="nofollow")', initialValue: false },
            ],
          },
        ],
      },
    },
    {
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string', description: 'Describe the image for accessibility and SEO' },
      ],
    },
    {
      type: 'object',
      name: 'calloutBlock',
      title: 'Info / Tip / Quote box',
      fields: [
        {
          name: 'variant', title: 'Type', type: 'string',
          options: {
            list: [
              { title: 'ℹ️ Info', value: 'info' },
              { title: '💡 Tip', value: 'tip' },
              { title: '⚠️ Warning', value: 'warning' },
              { title: '❝ Quote', value: 'quote' },
            ],
            layout: 'radio', direction: 'horizontal',
          },
          initialValue: 'info',
        },
        {
          name: 'author', title: 'Quoted by (optional)', type: 'reference',
          to: [{ type: 'author' }],
          description: 'Credits this box to an author — shows their photo, name and role underneath',
        },
        { name: 'title', title: 'Heading', type: 'string' },
        {
          name: 'body',
          title: 'Content',
          type: 'array',
          of: [{
            type: 'block',
            styles: [{ title: 'Normal', value: 'normal' }],
            lists: [
              { title: 'Bullet list', value: 'bullet' },
              { title: 'Numbered list', value: 'number' },
            ],
            marks: {
              decorators: [
                { title: 'Bold', value: 'strong' },
                { title: 'Italic', value: 'em' },
              ],
              annotations: [
                {
                  name: 'link',
                  type: 'object',
                  title: 'Link',
                  fields: [
                    { name: 'href', type: 'url', title: 'URL' },
                    { name: 'blank', type: 'boolean', title: 'Open in new tab' },
                  ],
                },
              ],
            },
          }],
        },
      ],
      preview: {
        select: { title: 'title', variant: 'variant' },
        prepare({ title, variant }: any) {
          const icons: Record<string, string> = { info: 'ℹ️', tip: '💡', warning: '⚠️' }
          return { title: title || 'Callout', subtitle: `${icons[variant] || 'ℹ️'} ${variant || 'info'}` }
        },
      },
    },
    {
      type: 'object',
      name: 'faqBlock',
      title: 'FAQ',
      components: { input: FaqBlockInput },
      fields: [
        {
          name: 'items', title: 'Questions & answers', type: 'array',
          of: [{
            type: 'object', name: 'faqItem',
            fields: [
              { name: 'question', title: 'Question', type: 'string' },
              { name: 'answer', title: 'Answer', type: 'text', rows: 3 },
            ],
            preview: { select: { title: 'question', subtitle: 'answer' } },
          }],
        },
      ],
      preview: {
        select: { items: 'items' },
        prepare({ items }: any) {
          return { title: 'FAQ', subtitle: `${(items || []).length} questions` }
        },
      },
    },
    {
      type: 'object',
      name: 'pageLinksBlock',
      title: 'Page Links (boxes)',
      description: 'A grid of link boxes pointing at pages you choose',
      fields: [
        {
          name: 'heading', title: 'Heading (optional)', type: 'string',
          description: 'Shown above the boxes, e.g. "Popular guides"',
        },
        {
          name: 'items', title: 'Links', type: 'array',
          of: [{
            type: 'object',
            name: 'pageLinkItem',
            fields: [
              {
                name: 'page', title: 'Page', type: 'reference',
                to: [
                  { type: 'page' }, { type: 'casinoGuide' }, { type: 'bookmaker' },
                  { type: 'bonus' }, { type: 'paymentMethod' }, { type: 'software' },
                  { type: 'casinoGame' }, { type: 'post' },
                ],
                validation: (r: any) => r.required(),
              },
              {
                name: 'label', title: 'Box text (optional)', type: 'string',
                description: 'What the box says. Leave empty to use the page title.',
              },
            ],
            preview: {
              select: { label: 'label', title: 'page.title', name: 'page.name' },
              prepare({ label, title, name }: any) {
                const target = title || name || 'Page'
                return { title: label || target, subtitle: label ? target : undefined }
              },
            },
          }],
        },
      ],
      preview: {
        select: { heading: 'heading', items: 'items' },
        prepare({ heading, items }: any) {
          const n = (items || []).length
          return {
            title: heading || 'Page Links',
            subtitle: `${n} ${n === 1 ? 'box' : 'boxes'}`,
          }
        },
      },
    },
    {
      type: 'object',
      name: 'cashbackCalculatorBlock',
      title: 'Cashback Calculator',
      fields: [
        {
          name: 'heading', title: 'Heading', type: 'string',
          description: 'Shown above the calculator, e.g. "Cashback-kalkylator"',
        },
        {
          name: 'currency', title: 'Currency symbol', type: 'string',
          description: 'e.g. kr, $, €, £', initialValue: 'kr',
        },
        { name: 'defaultNetLoss', title: 'Default net loss', type: 'number', initialValue: 500 },
        {
          name: 'defaultPercent', title: 'Default cashback (%)', type: 'number',
          description: 'e.g. 10 for 10% cashback', initialValue: 10,
        },
        {
          name: 'defaultCap', title: 'Default cashback cap', type: 'number',
          description: 'Leave empty or 0 for no cap',
        },
      ],
      preview: {
        select: { heading: 'heading', pct: 'defaultPercent', cap: 'defaultCap' },
        prepare({ heading, pct, cap }: any) {
          const parts = [pct ? `${pct}%` : null, cap ? `cap ${cap}` : null].filter(Boolean)
          return {
            title: heading || 'Cashback Calculator',
            subtitle: parts.length ? `Default ${parts.join(' · ')}` : 'Calculator',
          }
        },
      },
    },
    {
      type: 'object',
      name: 'providerBoxBlock',
      title: 'Payment Methods / Software Box',
      description: 'Shows a box of payment methods or software providers with logo + name',
      fields: [
        {
          name: 'provider', title: 'Show', type: 'string',
          options: {
            list: [
              { title: 'Payment methods', value: 'paymentMethod' },
              { title: 'Software providers', value: 'software' },
            ],
            layout: 'radio',
          },
          initialValue: 'paymentMethod',
          validation: (r: any) => r.required(),
        },
        {
          name: 'items', title: 'Pick specific ones (optional)', type: 'array',
          description: 'Leave empty to automatically show the first entries',
          of: [{ type: 'reference', to: [{ type: 'paymentMethod' }, { type: 'software' }] }],
        },
        {
          name: 'limit', title: 'How many to show', type: 'number',
          description: 'Only used when nothing is hand-picked above',
          initialValue: 6,
          validation: (r: any) => r.min(1).max(24),
        },
      ],
      preview: {
        select: { provider: 'provider', items: 'items', limit: 'limit' },
        prepare({ provider, items, limit }: any) {
          const what = provider === 'software' ? 'Software providers' : 'Payment methods'
          const count = items?.length ? `${items.length} hand-picked` : `first ${limit || 6}`
          return { title: what, subtitle: count }
        },
      },
    },
    {
      type: 'object',
      name: 'wageringCalculatorBlock',
      title: 'Wagering Calculator',
      fields: [
        {
          name: 'heading', title: 'Heading', type: 'string',
          description: 'Shown above the calculator, e.g. "Omsättningskalkylator"',
        },
        {
          name: 'currency', title: 'Currency symbol', type: 'string',
          description: 'e.g. kr, $, €, £', initialValue: 'kr',
        },
        {
          name: 'defaultDeposit', title: 'Default deposit amount', type: 'number',
          initialValue: 100,
        },
        {
          name: 'defaultBonusPercent', title: 'Default bonus (%)', type: 'number',
          description: 'e.g. 100 for a 100% match bonus', initialValue: 100,
        },
        {
          name: 'defaultWagering', title: 'Default wagering requirement (x)', type: 'number',
          description: 'e.g. 35 for 35x', initialValue: 35,
        },
        {
          name: 'defaultIncludeDeposit', title: 'Wagering applies to bonus + deposit', type: 'boolean',
          description: 'Off = wagering applies to the bonus amount only (most common). On = bonus + deposit.',
          initialValue: false,
        },
        {
          name: 'defaultContribution', title: 'Default game contribution (%)', type: 'number',
          description: 'e.g. 100 for slots, 10 for table games', initialValue: 100,
        },
      ],
      preview: {
        select: { heading: 'heading', w: 'defaultWagering' },
        prepare({ heading, w }: any) {
          return { title: heading || 'Wagering Calculator', subtitle: w ? `Default ${w}x` : 'Calculator' }
        },
      },
    },
    {
      type: 'object',
      name: 'prosConsBlock',
      title: 'Pros & Cons',
      components: { input: ProsConsBlockInput },
      fields: [
        { name: 'title', title: 'Heading (optional)', type: 'string' },
        { name: 'pros', title: 'Pros ✅', type: 'array', of: [{ type: 'string' }] },
        { name: 'cons', title: 'Cons ❌', type: 'array', of: [{ type: 'string' }] },
      ],
      preview: {
        select: { title: 'title', pros: 'pros', cons: 'cons' },
        prepare({ title, pros, cons }: any) {
          return { title: title || 'Pros & Cons', subtitle: `✅ ${(pros || []).length}  ❌ ${(cons || []).length}` }
        },
      },
    },
    {
      type: 'object',
      name: 'latestPostsBlock',
      title: 'Latest articles',
      fields: [
        { name: 'title', title: 'Heading', type: 'string', initialValue: 'Latest guides & articles' },
        {
          name: 'count', title: 'Number of articles', type: 'number',
          options: { list: [2, 3, 4, 6], layout: 'radio', direction: 'horizontal' },
          initialValue: 4,
        },
        { name: 'showViewAll', title: 'Show "View all" link', type: 'boolean', initialValue: true },
      ],
      preview: {
        select: { title: 'title', count: 'count' },
        prepare({ title, count }: any) {
          return { title: title || 'Latest articles', subtitle: `${count || 4} articles` }
        },
      },
    },
    {
      type: 'object',
      name: 'dropdownBlock',
      title: 'Dropdown / Accordion',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          description: 'The clickable heading shown when collapsed.',
          validation: (r: any) => r.required(),
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          description: 'The text shown when expanded.',
          of: [{
            type: 'block',
            styles: [
              { title: 'Normal', value: 'normal' },
              { title: 'H3', value: 'h3' },
              { title: 'H4', value: 'h4' },
            ],
            lists: [
              { title: 'Bullet', value: 'bullet' },
              { title: 'Numbered', value: 'number' },
            ],
            marks: {
              decorators: [
                { title: 'Bold', value: 'strong' },
                { title: 'Italic', value: 'em' },
              ],
              annotations: [{
                name: 'link', type: 'object', title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL', validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto'] }) },
                  { name: 'blank', type: 'boolean', title: 'Open in new tab', initialValue: false },
                ],
              }],
            },
          }],
        },
        {
          name: 'defaultOpen',
          title: 'Open by default',
          type: 'boolean',
          initialValue: false,
          description: 'If enabled, the dropdown will be expanded when the page loads.',
        },
      ],
      preview: {
        select: { title: 'title', defaultOpen: 'defaultOpen' },
        prepare({ title, defaultOpen }: any) {
          return { title: `▾ ${title || 'Dropdown'}`, subtitle: defaultOpen ? 'Open by default' : 'Collapsed by default' }
        },
      },
    },
    {
      type: 'object',
      name: 'ctaButton',
      title: 'CTA Button',
      fields: [
        { name: 'text', title: 'Button text', type: 'string' },
        { name: 'url',  title: 'URL',         type: 'url' },
      ],
      preview: {
        select: { title: 'text', subtitle: 'url' },
        prepare({ title, subtitle }: any) {
          return { title: title || 'CTA Button', subtitle: subtitle || '' }
        },
      },
    },
    // ── Casino card (bookmaker) ─────────────────────────────────────────────
    {
      type: 'object',
      name: 'casinoKortBlock',
      title: '🎰 Casino card',
      fields: [
        {
          name: 'bookmaker',
          title: 'Select casino',
          type: 'reference',
          to: [{ type: 'bookmaker' }],
        },
        { name: 'customTitle', title: 'Title', type: 'string' },
        { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
        {
          name: 'customBody',
          title: 'Body text',
          type: 'array',
          of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [{ title: 'Bullet list', value: 'bullet' }, { title: 'Numbered list', value: 'number' }], marks: { decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }] } }],
        },
        { name: 'pros', title: '✅ Pros', type: 'array', of: [{ type: 'string' }] },
        { name: 'cons', title: '❌ Cons', type: 'array', of: [{ type: 'string' }] },
      ],
      preview: {
        select: { customTitle: 'customTitle', name: 'bookmaker.name', logo: 'bookmaker.logo' },
        prepare({ customTitle, name, logo }: any) {
          return { title: customTitle || name || 'Casino card', subtitle: name, media: logo }
        },
      },
    },
    // ── Bonus card ───────────────────────────────────────────────────────────
    {
      type: 'object',
      name: 'bonusKortBlock',
      title: '🎁 Bonus card',
      fields: [
        {
          name: 'bonus',
          title: 'Select bonus',
          type: 'reference',
          to: [{ type: 'bonus' }],
        },
        { name: 'customTitle', title: 'Title', type: 'string' },
        { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
        {
          name: 'customBody',
          title: 'Body text',
          type: 'array',
          of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [{ title: 'Bullet list', value: 'bullet' }, { title: 'Numbered list', value: 'number' }], marks: { decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }] } }],
        },
      ],
      preview: {
        select: { customTitle: 'customTitle', bonusTitle: 'bonus.title', bmName: 'bonus.bookmaker.name', logo: 'bonus.casinoLogo' },
        prepare({ customTitle, bonusTitle, bmName, logo }: any) {
          return { title: customTitle || bmName || bonusTitle || 'Bonus card', subtitle: bonusTitle, media: logo }
        },
      },
    },
    {
      type: 'object',
      name: 'detailsTable',
      title: 'Details Table (Area / Details)',
      fields: [
        {
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [{
            type: 'object',
            name: 'tableRow',
            title: 'Row',
            fields: [
              { name: 'area', title: 'Area', type: 'string' },
              { name: 'details', title: 'Details', type: 'string' },
            ],
            preview: {
              select: { area: 'area', details: 'details' },
              prepare({ area, details }: any) { return { title: area, subtitle: details } },
            },
          }],
        },
      ],
      preview: {
        select: { rows: 'rows' },
        prepare({ rows }: any) {
          return { title: 'Details Table', subtitle: `${(rows || []).length} rows` }
        },
      },
    },
    {
      type: 'object',
      name: 'tableBlock',
      title: 'Table',
      components: { input: TableBlockInput },
      fields: [
        { name: 'title', title: 'Heading (optional)', type: 'string' },
        {
          name: 'headers',
          title: 'Column headers',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [{
            type: 'object',
            name: 'tableRow',
            title: 'Row',
            fields: [{ name: 'cells', title: 'Cells', type: 'array', of: [{ type: 'string' }] }],
            preview: {
              select: { cells: 'cells' },
              prepare({ cells }: any) { return { title: (cells || []).join(' | ') || '(empty row)' } },
            },
          }],
        },
      ],
      preview: {
        select: { title: 'title', headers: 'headers', rows: 'rows' },
        prepare({ title, headers, rows }: any) {
          return { title: title || 'Table', subtitle: `${(headers || []).length} columns · ${(rows || []).length} rows` }
        },
      },
    },
    {
      type: 'object',
      name: 'howToBlock',
      title: 'How-to',
      fields: [
        {
          name: 'title',
          title: 'Section title',
          type: 'string',
          initialValue: 'How It Works',
        },
        {
          name: 'items',
          title: 'Steps',
          type: 'array',
          of: [{
            type: 'object',
            name: 'howToItem',
            title: 'Step',
            fields: [
              { name: 'title', title: 'Step title', type: 'string' },
              { name: 'body',  title: 'Body text',  type: 'text', rows: 3 },
            ],
            preview: {
              select: { title: 'title', subtitle: 'body' },
            },
          }],
        },
      ],
      preview: {
        select: { title: 'title', items: 'items' },
        prepare({ title, items }: any) {
          return { title: title || 'How-to', subtitle: `${(items || []).length} steps` }
        },
      },
    },
  ],
})

export const pageType = defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'slug',  title: 'Slug',  type: 'slug',   group: 'content', options: { source: 'title', isUnique: isSlugUniquePerMarket }, validation: (r) => r.required() }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
      group: 'content',
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
      name: 'parent',
      title: 'Parent page',
      type: 'reference',
      weak: true,
      to: [{ type: 'page' }],
      group: 'content',
      options: {
        disableNew: true,
        filter: ({ document }: any) => ({
          filter: '_type == "page" && market == $market && _id != $id && !(_id in path("drafts.**"))',
          params: {
            market: (document as any).market || 'global',
            id: (document as any)._id?.replace(/^drafts\./, '') || '',
          },
        }),
      },
      description: 'Optional — nests this page under a parent (e.g. /parent/this-page/). Only shows pages in the same market.',
    }),
    { ...introField, title: 'Intro', group: 'content' } as any,
    ...comparisonTableFields.map(f => ({ ...f, group: 'content' })) as any,
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      description: 'Shown in hero and as author card at the bottom of the page',
    }),
    defineField({
      name: 'factChecker',
      title: 'Fact checker',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      description: 'Shown next to the author in the hero section',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      group: 'content',
      description: 'Shown below the author name in hero',
    }),
    defineField({
      name: 'showBonusGrid',
      title: 'Show free-spins bonus grid',
      type: 'boolean',
      group: 'content',
      initialValue: false,
      description: 'Renders the grid of bonuses that have "Show in free-spins grid" enabled.',
    }),
    defineField({
      name: 'bonusGridTitle',
      title: 'Bonus grid heading (optional)',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'hideAuthor',
      title: 'Hide author',
      type: 'boolean',
      group: 'content',
      initialValue: false,
      description: 'When enabled, the author bar and author card are not shown on this page (e.g. About us, Privacy Policy)',
    }),
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'featuredImage', title: 'OG image', type: 'image', group: 'seo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      a1: 'parent.slug.current',
      a2: 'parent.parent.slug.current',
      a3: 'parent.parent.parent.slug.current',
      a4: 'parent.parent.parent.parent.slug.current',
    },
    prepare({ title, slug, a1, a2, a3, a4 }: any) {
      const parts = [a4, a3, a2, a1, slug].filter(Boolean)
      return { title: title || '(untitled)', subtitle: `/${parts.join('/')}/` }
    },
  },
})
