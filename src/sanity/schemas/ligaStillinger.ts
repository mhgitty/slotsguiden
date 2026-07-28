import { defineField, defineType } from 'sanity'
import { bodyField } from './page'

// Leagues available on the Sportsmonks free plan.
// Find IDs in your Sportsmonks dashboard → Leagues, or add more here as you upgrade.
const AVAILABLE_LEAGUES = [
  { title: '🇩🇰 Superliga (Danmark)', value: 271 },
  { title: '🇩🇰 Superliga Play-offs (Danmark)', value: 1659 },
  { title: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Premiership (Skotland)', value: 501 },
  { title: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Premiership Play-Offs (Skotland)', value: 513 },
]

export const ligaStillingerType = defineType({
  name: 'ligaStillinger',
  title: 'Liga stillinger',
  type: 'document',
  icon: () => '🏆',
  fields: [
    defineField({
      name: 'title',
      title: 'H1 Titel',
      type: 'string',
      description: 'Sidens overskrift — vises som H1 på frontend. Brug [year] for indeværende år.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'leagueName',
      title: 'Liga navn (visningsnavn)',
      type: 'string',
      description: 'Fx "Superliga" — bruges til breadcrumbs og interne referencer.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Liga logo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt tekst', type: 'string' },
      ],
    }),
    defineField({
      name: 'intro',
      title: 'Intro tekst',
      type: 'text',
      rows: 3,
      description: 'Vises under H1 i hero-sektionen på frontend.',
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'leagueId',
      title: 'Liga',
      type: 'number',
      description: 'Vælg hvilken liga du vil vise stillinger for.',
      options: {
        list: AVAILABLE_LEAGUES,
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'seasonId',
      title: 'Sæson ID (valgfrit)',
      type: 'number',
      description: 'Udfyld kun hvis du vil vise en specifik sæson frem for den aktuelle.',
    }),
    defineField({
      ...bodyField,
      title: 'Brødtekst (under stillinger)',
      description: 'Vises under standings-tabellen på frontend.',
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta titel',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta beskrivelse',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Sidst opdateret',
      type: 'date',
      group: 'seo',
    }),
  ],

  groups: [
    { name: 'seo', title: 'SEO', icon: () => '🔍' },
  ],

  preview: {
    select: { title: 'title', leagueName: 'leagueName' },
    prepare({ title, leagueName }: any) {
      return {
        title: title || 'Uden titel',
        subtitle: leagueName || '',
        media: () => '🏆',
      }
    },
  },
})
