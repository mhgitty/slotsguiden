import { defineField, defineType } from 'sanity'

/**
 * Standalone template document for comparison tables.
 * Pages reference a template — change the template once, all pages update.
 */
export const comparisonTableTemplateType = defineType({
  name: 'comparisonTableTemplate',
  title: '📊 Sammenligningsskabeloner',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Skabelonnavn',
      type: 'string',
      description: 'Internt navn — vises kun i Studio. F.eks. "Forside – top bonusser"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'market',
      title: 'Market',
      type: 'string',
      description: 'Which market this template belongs to. Only casinos/bonuses from this market can be added.',
      options: {
        list: [
          { title: '🌍 Global', value: 'global' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'global',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tableType',
      title: 'Vis',
      type: 'string',
      options: {
        list: [
          { title: '🎁 Bonusser', value: 'bonus' },
          { title: '🏆 Bookmakers', value: 'bookmaker' },
          { title: '🎡 Free spins til eksisterende kunder', value: 'freeSpinsEksisterende' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'bonus',
      validation: (r) => r.required(),
      description: '"Free spins til eksisterende kunder" bruger samme kort-design som free-spins-listen (kampagnebillede, spinværdi, udløbsdato osv.).',
    }),
    defineField({
      name: 'bonuses',
      title: 'Bonusser',
      type: 'array',
      description: 'Træk for at ændre rækkefølge.',
      of: [
        {
          type: 'reference',
          to: [{ type: 'bonus' }],
          options: {
            disableNew: true,
            // "Free spins til eksisterende kunder" bonuses aren't necessarily
            // marked active, so for that type we only filter by market.
            filter: ({ document }: any) => ({
              filter: document?.tableType === 'freeSpinsEksisterende'
                ? 'market == $market'
                : 'active == true && market == $market',
              params: { market: document?.market || 'global' },
            }),
          },
        },
      ],
      hidden: ({ document }: any) => document?.tableType !== 'bonus' && document?.tableType !== 'freeSpinsEksisterende',
    }),
    defineField({
      name: 'bookmakers',
      title: 'Bookmakers',
      type: 'array',
      description: 'Træk for at ændre rækkefølge.',
      of: [
        {
          type: 'reference',
          to: [{ type: 'bookmaker' }],
          options: {
            disableNew: true,
            filter: ({ document }: any) => ({
              filter: 'market == $market',
              params: { market: document?.market || 'global' },
            }),
          },
        },
      ],
      hidden: ({ document }: any) => document?.tableType !== 'bookmaker',
    }),
    defineField({
      name: 'showMoreButton',
      title: 'Vis "Se flere casinoer"-knap',
      type: 'boolean',
      description: 'Vis kun et bestemt antal i listen, og skjul resten bag en "Se flere casinoer"-knap.',
      initialValue: false,
    }),
    defineField({
      name: 'visibleCount',
      title: 'Antal vist før knappen',
      type: 'number',
      description: 'Hvor mange rækker der vises som standard, før knappen. Kun aktiv når knappen er slået til.',
      validation: (r) => r.min(1).integer(),
      hidden: ({ document }: any) => !document?.showMoreButton,
    }),
    defineField({
      name: 'moreButtonLabel',
      title: 'Knaptekst',
      type: 'string',
      description: 'Teksten på knappen. Efterlad tom for at bruge "Se flere casinoer". Antallet tilføjes automatisk, fx "Se flere casinoer (12)".',
      hidden: ({ document }: any) => !document?.showMoreButton,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      tableType: 'tableType',
      bonuses: 'bonuses',
      bookmakers: 'bookmakers',
    },
    prepare({ title, tableType, bonuses, bookmakers }: any) {
      const isBookmaker = tableType === 'bookmaker'
      const count = isBookmaker ? (bookmakers || []).length : (bonuses || []).length
      const label = tableType === 'freeSpinsEksisterende'
        ? 'free spins (eksisterende)'
        : isBookmaker ? 'bookmakers' : 'bonusser'
      return { title, subtitle: `${count} ${label}` }
    },
  },
})
