import { defineField, defineType } from 'sanity'
import { bodyField, relatedPagesFields } from './page'

// Slot machines. Same type name and field names as Pokcas, Bonorapido and
// Spelaisverige ("slotmachine"), so content made for those sites can be pushed
// here unchanged. Pages live at /online-spillemaskiner/[slug]/.
// Extras on Slotsguiden only: publishedAt, lastUpdated and the "Nøgletal" block
// in the body. Volatility is stored in English (Low … High) and shown in Danish.

// Restrict a bookmaker reference picker to the document's own market.
function sameMarketBookmakerFilter({ document }: any) {
  const market = document?.market || 'global'
  if (market === 'global') return { filter: 'market == "global" || !defined(market)' }
  return { filter: 'market == $market', params: { market } }
}

export const slotmachineType = defineType({
  name: 'slotmachine',
  title: 'Online Spillemaskiner',
  type: 'document',
  __experimental_search: [
    { weight: 10, path: 'name' },
    { weight: 8, path: 'titel' },
    { weight: 6, path: 'slug.current' },
    { weight: 3, path: 'metaTitle' },
    { weight: 0, path: 'body' },
    { weight: 0, path: 'intro' },
  ],
  groups: [
    { name: 'general', title: '⚙️ General' },
    { name: 'specs', title: '🎰 Specs' },
    { name: 'content', title: '📝 Content' },
    { name: 'seo', title: '🔍 SEO' },
  ],
  fields: [
    // ── General ────────────────────────────────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'general',
      description: 'The slot name, e.g. "Book of Dead"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'titel',
      title: 'H1',
      type: 'string',
      group: 'general',
      description: 'Displayed as the H1 on the page. Falls back to Name if empty.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'general',
      options: { source: 'name' },
      description: 'Used in URL: /online-spillemaskiner/[slug]',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
      group: 'general',
      options: { list: [{ title: '🌍 Global', value: 'global' }], layout: 'radio' },
      initialValue: 'global',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo / thumbnail',
      type: 'image',
      group: 'general',
      description: 'The game picture: used in the hero, on slot cards and behind the demo while it loads.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'ogImage',
      title: 'OG Image',
      type: 'image',
      group: 'general',
      description: 'Used for social sharing previews.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'casinos',
      title: 'Where to play (casinos)',
      type: 'array',
      group: 'general',
      description: 'The casinos in the "Spil for rigtige penge" picker next to the demo, in this order. Empty = the standard list from Site settings → Slot pages.',
      of: [{ type: 'reference', weak: true, to: [{ type: 'bookmaker' }], options: { filter: sameMarketBookmakerFilter } }],
      validation: (r) => r.max(8),
    }),
    defineField({
      name: 'highlightCasino',
      title: 'Highlighted casino',
      type: 'reference',
      weak: true,
      group: 'general',
      to: [{ type: 'bookmaker' }],
      options: { filter: sameMarketBookmakerFilter },
      description: 'Shown first and pre-selected in the casino picker next to the demo. Set it on slots that get a lot of traffic.',
    }),
    defineField({ name: 'publishedAt', title: 'Published date', type: 'datetime', group: 'general' }),
    defineField({ name: 'lastUpdated', title: 'Last updated', type: 'datetime', group: 'general' }),

    // ── Specs ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'provider', title: 'Provider', type: 'reference', weak: true, group: 'specs',
      to: [{ type: 'software' }],
      description: 'The game studio — select from your software providers.',
    }),
    defineField({ name: 'rtp', title: 'RTP', type: 'string', group: 'specs', description: 'e.g. "96,21%"' }),
    defineField({
      name: 'volatility', title: 'Volatility', type: 'string', group: 'specs',
      description: 'Shown in Danish on the site (Lav, Middel, Høj …).',
      options: {
        list: [
          { title: 'Low (Lav)', value: 'Low' },
          { title: 'Medium-Low (Lav-middel)', value: 'Medium-Low' },
          { title: 'Medium (Middel)', value: 'Medium' },
          { title: 'Medium-High (Middel-høj)', value: 'Medium-High' },
          { title: 'High (Høj)', value: 'High' },
        ],
      },
    }),
    defineField({ name: 'maxWin', title: 'Max win', type: 'string', group: 'specs', description: 'e.g. "5.000x indsatsen"' }),
    defineField({ name: 'grid', title: 'Grid', type: 'string', group: 'specs', description: 'e.g. "5x3" or "6 hjul / 5 rækker"' }),
    defineField({ name: 'paylines', title: 'Paylines', type: 'string', group: 'specs', description: 'e.g. "20 faste linjer" or "243 måder at vinde"' }),
    defineField({ name: 'mechanic', title: 'Mechanic', type: 'string', group: 'specs', description: 'e.g. "Cluster pays", "Megaways"' }),
    defineField({ name: 'theme', title: 'Theme', type: 'string', group: 'specs', description: 'e.g. "Oldtidens Egypten"' }),
    defineField({
      name: 'features', title: 'Features', type: 'array', group: 'specs',
      of: [{ type: 'string' }], options: { layout: 'tags' },
      description: 'e.g. Free spins, Wilds, Multiplikatorer',
    }),
    defineField({ name: 'minBetPerSpin', title: 'Min bet per spin', type: 'string', group: 'specs', description: 'e.g. "0,20 kr."' }),
    defineField({ name: 'maxBetPerSpin', title: 'Max bet per spin', type: 'string', group: 'specs', description: 'e.g. "100 kr."' }),
    defineField({ name: 'hasBonusBuy', title: 'Has bonus buy', type: 'boolean', group: 'specs', initialValue: false, description: 'Bonus buy is not offered at Danish licensed casinos; the page says so.' }),
    defineField({ name: 'hasJackpot', title: 'Has jackpot', type: 'boolean', group: 'specs', initialValue: false }),
    defineField({ name: 'hitFrequencyPercent', title: 'Hit frequency (%)', type: 'string', group: 'specs', description: 'e.g. "24%"' }),
    defineField({ name: 'releaseYear', title: 'Release date', type: 'string', group: 'specs', description: 'Any format, e.g. "Februar 2021" or "2021"' }),

    // ── Content ────────────────────────────────────────────────────────────────
    defineField({
      name: 'demoIframeTitle',
      title: 'Demo iframe title',
      type: 'string',
      group: 'content',
      description: 'Heading shown above the game demo, e.g. "Spil Book of Dead gratis". Empty = "Gratis demo".',
    }),
    defineField({
      name: 'demoIframe',
      title: 'Demo iframe embed code',
      type: 'text',
      rows: 4,
      group: 'content',
      description: 'Paste the full <iframe …></iframe> embed code for the game demo (a plain https link also works). Leave empty to hide the demo.',
    }),
    { ...bodyField, title: 'Intro', name: 'intro', group: 'content' } as any,
    {
      ...bodyField,
      group: 'content',
      of: [
        ...(bodyField as any).of,
        {
          type: 'object',
          name: 'slotSpecsBlock',
          title: 'Nøgletal (fra Specs)',
          fields: [defineField({ name: 'note', title: 'Note', type: 'string', readOnly: true, initialValue: 'Shows the key facts from the Specs tab here.' })],
          preview: { prepare: () => ({ title: '🎰 Nøgletal', subtitle: 'Key-fact tiles from the Specs tab' }) },
        },
      ],
    } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),

    // ── SEO ────────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle', options: { search: { weight: 0 } }, title: 'Meta Title', type: 'string', group: 'seo', description: 'SEO title tag. Max 60 characters.' }),
    defineField({ name: 'metaDescription', options: { search: { weight: 0 } }, title: 'Meta Description', type: 'text', rows: 3, group: 'seo', description: 'SEO meta description. 140–155 characters.' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'provider.name', media: 'logo' },
    prepare({ title, subtitle, media }: any) {
      return { title, subtitle: subtitle || '—', media }
    },
  },
})
