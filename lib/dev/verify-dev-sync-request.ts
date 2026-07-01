/**
 * verify-dev-sync-request — gate for `/api/dev/*` ops routes that write to Sanity.
 *
 * When `DEV_SYNC_TOKEN` is unset, allows requests in non-production only.
 * When set, requires the same value via `?token=` or `x-dev-sync-token` header.
 */

/**
 * Returns whether the request may run a dev sync / backfill route.
 *
 * @param request - Incoming HTTP request
 */
export function isDevSyncRequestAuthorized(request: Request): boolean {
  const secret = process.env.DEV_SYNC_TOKEN?.trim();

  if (!secret) {
    return process.env.VERCEL_ENV !== "production";
  }

  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get("token")?.trim();
  const headerToken = request.headers.get("x-dev-sync-token")?.trim();

  return queryToken === secret || headerToken === secret;
}

/**
 * JSON body returned when a dev sync route rejects an unauthenticated request.
 */
export function devSyncUnauthorizedResponse(): Response {
  return Response.json(
    {
      error:
        "Unauthorized. Set DEV_SYNC_TOKEN in the environment and pass the same value as ?token=... or the x-dev-sync-token header.",
    },
    { status: 401 },
  );
}
