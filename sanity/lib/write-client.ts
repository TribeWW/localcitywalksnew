import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

/**
 * Validates that the Sanity write token is available
 * Throws a clear error if the token is missing to prevent silent failures
 */
function getWriteToken(): string {
  const token = process.env.SANITY_WRITE_TOKEN
  
  if (!token) {
    throw new Error(
      'Missing SANITY_WRITE_TOKEN environment variable. ' +
      'Please add it to your .env.local file with a valid Sanity API token with write permissions.'
    )
  }

  return token
}

/**
 * Write-enabled Sanity client for server-side mutations
 * 
 * Differences from read client (sanity/lib/client.ts):
 * - useCdn: false - Write operations must hit live API, not cached
 * - token: Required - Authenticates write operations
 * 
 * Use this client only in server actions or API routes.
 * Never expose this client to client components.
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Write operations need fresh data, not cached
  token: getWriteToken(),
})
