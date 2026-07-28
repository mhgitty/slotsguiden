import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { media } from 'sanity-plugin-media'
import { schemaTypes } from './src/sanity/schemas'
import { WideStudioLayout } from './src/sanity/StudioLayout'
import { previewAction } from './src/sanity/previewAction'

export default defineConfig({
  name: 'default',
  title: 'Slotsguiden.dk',
  basePath: '/studio',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Indhold')
          .items([
            // ── Singletons ──────────────────────────────────────────────────
            S.listItem()
              .title('🏠 Homepage')
              .id('homepage')
              .child(
                S.document()
                  .schemaType('homepage')
                  .documentId('homepage')
              ),
            S.listItem()
              .title('⚙️ Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
            S.divider(),

            // ── Content ──────────────────────────────────────────────────────
            S.listItem()
              .title('🎰 Casino Reviews')
              .schemaType('bookmaker')
              .child(
                S.documentTypeList('bookmaker')
                  .title('Casino Reviews')
              ),
            S.listItem()
              .title('🎁 Bonuses')
              .schemaType('bonus')
              .child(
                S.documentTypeList('bonus')
                  .title('Bonuses')
              ),
            S.listItem()
              .title('📄 Pages')
              .schemaType('page')
              .child(
                S.documentTypeList('page')
                  .title('Pages')
              ),
            S.listItem()
              .title('💳 Payment Methods')
              .schemaType('paymentMethod')
              .child(
                S.documentTypeList('paymentMethod')
                  .title('Payment Methods')
              ),
            S.listItem()
              .title('🎮 Software')
              .schemaType('software')
              .child(
                S.documentTypeList('software')
                  .title('Software')
              ),
            S.listItem()
              .title('🎲 Casino Games')
              .schemaType('casinoGame')
              .child(
                S.documentTypeList('casinoGame')
                  .title('Casino Games')
              ),
            S.listItem()
              .title('📚 Casino Guides')
              .schemaType('casinoGuide')
              .child(
                S.documentTypeList('casinoGuide')
                  .title('Casino Guides')
              ),
            S.listItem()
              .title('📊 Comparison Templates')
              .schemaType('comparisonTableTemplate')
              .child(
                S.documentTypeList('comparisonTableTemplate')
                  .title('Comparison Templates')
              ),

            S.divider(),

            // ── Shared content ───────────────────────────────────────────────
            S.listItem()
              .title('📝 Posts')
              .schemaType('post')
              .child(S.documentTypeList('post').title('All Posts')),
            S.listItem()
              .title('🔗 Redirects')
              .schemaType('redirect')
              .child(
                S.documentTypeList('redirect')
                  .title('Redirects — Global (/go/...)')
                  .filter('_type == "redirect" && (market == "global" || !defined(market))')
              ),
            S.listItem()
              .title('↩ 301 Redirects')
              .schemaType('pageRedirect')
              .child(
                S.documentTypeList('pageRedirect')
                  .title('301 Redirects')
                  .defaultOrdering([{ field: 'from', direction: 'asc' }])
              ),
            S.listItem()
              .title('🌐 Hreflang')
              .schemaType('hreflangGroup')
              .child(
                S.documentTypeList('hreflangGroup')
                  .title('Hreflang Groups')
                  .defaultOrdering([{ field: 'name', direction: 'asc' }])
              ),
            S.divider(),
            S.listItem()
              .title('👤 Authors')
              .schemaType('author')
              .child(S.documentTypeList('author').title('Authors')),
            S.listItem()
              .title('🏷️ Categories')
              .schemaType('category')
              .child(S.documentTypeList('category').title('Categories')),
          ]),
    }),
    visionTool(),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, ctx) => {
      const PREVIEW_TYPES = ['homepage', 'post', 'page', 'bookmaker', 'bonus', 'paymentMethod', 'software', 'casinoGame', 'casinoGuide']
      if (PREVIEW_TYPES.includes(ctx.schemaType)) {
        return [previewAction, ...prev]
      }
      return prev
    },
  },

  studio: {
    components: {
      layout: WideStudioLayout,
    },
  },
})
