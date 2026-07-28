import { defineCliConfig } from 'sanity/cli'

// Lets the Sanity CLI (e.g. `sanity dataset export`) know which project/dataset
// to target. Set the project id via NEXT_PUBLIC_SANITY_PROJECT_ID.
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  },
})
