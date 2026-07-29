import { defineField, defineType } from 'sanity'
import { bodyField, relatedPagesFields } from './page'

export const bonusType = defineType({
  name: 'bonus',
  title: 'Bonuses',
  type: 'document',
  groups: [
    { name: 'info',    title: '🎁 Bonus info' },
    { name: 'details', title: '📋 Details' },
    { name: 'bonustyper', title: '🎯 Bonustyper' },
    { name: 'content', title: '📝 Content' },
    { name: 'seo',     title: '🔍 SEO' },
  ],
  fields: [
    // ── Identity ─────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'info',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: '🌍 Global', value: 'global' },
        ],
        layout: 'radio',
      },
      initialValue: 'global',
      validation: (r) => r.required(),
    }),

    // ── Active ────────────────────────────────────────────────────────────────
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'info',
      description: 'Only active bonuses are shown in comparison lists',
      initialValue: false,
    }),
    defineField({
      name: 'showInFreeSpinsGrid',
      title: 'Show in free-spins grid (existing customers)',
      type: 'boolean',
      group: 'info',
      description: 'When on, this bonus appears in the grid on /free-spins-til-eksisterende-kunder/. Automatically removed after the campaign end date.',
      initialValue: false,
    }),
    defineField({
      name: 'showInPopup',
      title: 'Show in pop-up',
      type: 'boolean',
      group: 'info',
      description: 'When on, this bonus is shown in the site-wide pop-up that appears after a few seconds on every page. If several are on, the most recently published one is used.',
      initialValue: false,
    }),

    // ── Bookmaker relation ────────────────────────────────────────────────────
    defineField({
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      group: 'info',
      description: 'Original publish date — used for "recently added" ordering.',
    }),
    defineField({
      name: 'bookmaker',
      title: 'Casino',
      type: 'reference',
      group: 'info',
      to: [{ type: 'bookmaker' }],
      description: 'Which casino does this bonus belong to?',
    }),

    // ── Core bonus fields ─────────────────────────────────────────────────────
    defineField({
      name: 'casinoNavn',
      title: 'Casino name',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'casinoLogo',
      title: 'Casino logo',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'casinoLogoSquare',
      title: 'Casino logo square',
      type: 'image',
      group: 'info',
      description: 'Square version of the casino logo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'oddsBonusTitel',
      title: 'Bonus title',
      type: 'string',
      group: 'info',
      description: 'E.g. "Get $500 free bet" — shown on the comparison card',
    }),
    defineField({
      name: 'offerUrl',
      title: 'Offer URL',
      type: 'url',
      group: 'info',
      description: 'Affiliate link to the bonus offer',
    }),
    defineField({
      name: 'minimumOdds',
      title: 'Minimum odds',
      type: 'string',
      group: 'info',
      description: 'E.g. "1.70"',
    }),

    // ── Bonus details ─────────────────────────────────────────────────────────
    defineField({
      name: 'minimumIndbetaling',
      title: 'Minimum deposit',
      type: 'number',
      group: 'details',
    }),
    defineField({
      name: 'gennemspilskrav',
      title: 'Wager requirement',
      type: 'string',
      group: 'details',
      description: 'E.g. "x10" or "None"',
    }),
    defineField({
      name: 'spinVaerdi',
      title: 'Spin value',
      type: 'string',
      group: 'details',
      description: 'E.g. "$0.10 per spin"',
    }),
    defineField({
      name: 'maksGevinst',
      title: 'Max winnings',
      type: 'string',
      group: 'details',
      description: 'E.g. "$500" or "Unlimited"',
    }),
    defineField({
      name: 'terms',
      title: 'Terms and conditions',
      type: 'text',
      rows: 3,
      group: 'details',
    }),
    defineField({
      name: 'bonuskode',
      title: 'Bonus code',
      type: 'string',
      group: 'details',
    }),

    // ── Campaign ──────────────────────────────────────────────────────────────
    defineField({
      name: 'kampagneBillede',
      title: 'Campaign image',
      type: 'image',
      group: 'details',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'kampagneStart',
      title: 'Campaign start',
      type: 'datetime',
      group: 'details',
    }),
    defineField({
      name: 'kampagneSlut',
      title: 'Campaign end',
      type: 'datetime',
      group: 'details',
    }),

    // ── Bonus types (titel / beskrivelse / placering) ─────────────────────────
    defineField({ name: 'freeSpinsEksisterendeTitel', title: 'Free spins til eksisterende kunder — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'freeSpinsEksisterendeBeskrivelse', title: 'Free spins til eksisterende kunder — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'casinoBonusTitel', title: 'Casino bonus — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'casinoBonusBeskrivelse', title: 'Casino bonus — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'indbetalingsbonusTitel', title: 'Indbetalingsbonus — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'indbetalingsbonusBeskrivelse', title: 'Indbetalingsbonus — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'freeSpinsUdenIndbetalingTitel', title: 'Free spins uden indbetaling — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'freeSpinsUdenIndbetalingBeskrivelse', title: 'Free spins uden indbetaling — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'freeSpinsVedOprettelseTitel', title: 'Free spins ved oprettelse — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'freeSpinsVedOprettelsePlacering', title: 'Free spins ved oprettelse — Placering', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'casinoKampagnerTitel', title: 'Casino kampagner — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'casinoKampagnerBeskrivelse', title: 'Casino kampagner — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'bonusUdenIndbetalingTitel', title: 'Bonus uden indbetaling — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'bonusUdenIndbetalingBeskrivelse', title: 'Bonus uden indbetaling — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'bonusUdenIndbetalingPlacering', title: 'Bonus uden indbetaling — Placering', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'bonusUdenOmsaetningskravTitel', title: 'Bonus uden omsætningskrav — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'bonusUdenOmsaetningskravBeskrivelse', title: 'Bonus uden omsætningskrav — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'velkomstbonusTitel', title: 'Velkomstbonus — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'velkomstbonusBeskrivelse', title: 'Velkomstbonus — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),
    defineField({ name: 'freeSpinsTitel', title: 'Free spins — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'bonuskodePromoTekst', title: 'Bonuskode promo tekst', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'cashbackTitel', title: 'Cashback — Titel', type: 'string', group: 'bonustyper' }),
    defineField({ name: 'cashbackBeskrivelse', title: 'Cashback — Beskrivelse', type: 'text', rows: 3, group: 'bonustyper' }),

    defineField({
      name: 'hvorSkalBonusVises',
      title: 'Hvor skal denne bonus vises',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'bonustyper',
      description: 'Placeringer hvor denne bonus skal vises (fra WordPress)',
    }),
    // ── Page content ──────────────────────────────────────────────────────────
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),

    // ── SEO ───────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle',       title: 'Meta title',       type: 'string',             group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3,      group: 'seo' }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      group: 'seo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  preview: {
    select: {
      title:    'title',
      subtitle: 'casinoNavn',
      media:    'casinoLogo',
    },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle || '', media }
    },
  },
})
