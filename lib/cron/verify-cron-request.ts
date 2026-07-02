/**
 * verify-cron-request — gate for `/api/cron/*` routes invoked by Vercel Cron.
 *
 * When `CRON_SECRET` is set in the Vercel project, scheduled cron jobs send
 * `Authorization: Bearer <CRON_SECRET>`. Manual invocations must use the same header.
 */

/**
 * Returns whether the request may run a Vercel Cron route.
 *
 * @param request - Incoming HTTP request
 */
export function isCronRequestAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * JSON body returned when a cron route rejects an unauthenticated request.
 */
export function cronUnauthorizedResponse(): Response {
  return Response.json(
    {
      error:
        "Unauthorized. Set CRON_SECRET in the environment and pass Authorization: Bearer <CRON_SECRET>.",
    },
    { status: 401 },
  );
}
