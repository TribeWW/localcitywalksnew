'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

/** Schema types edited only via fixed-id Desk items — hide from global Create. */
const SINGLETON_TEMPLATE_IDS = new Set(['homeSpotlight', 'promoBanner'])

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  document: {
    /**
     * Singletons stay reachable from Desk (`documentId(...)` editors) but must
     * not appear in the global Create menu as free-form new documents.
     */
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type !== 'global') {
        return prev
      }
      return prev.filter(
        (templateItem) => !SINGLETON_TEMPLATE_IDS.has(templateItem.templateId),
      )
    },
  },
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
