/**
 * Resolves the public site origin for Stripe redirect URLs (LOC-1161).
 */

import { SITE_URL } from "@/lib/site";

/** Host patterns allowed for preview/dev request-derived checkout origins. */
const PREVIEW_CHECKOUT_HOST_PATTERNS: readonly RegExp[] = [
  /^[a-z0-9-]+\.vercel\.app$/i,
  /^localhost(:\d+)?$/i,
  /^127\.0\.0\.1(:\d+)?$/,
  /^([a-z0-9-]+\.)?localcitywalks\.com$/i,
];

/**
 * Returns the canonical production origin for Stripe redirects.
 *
 * Prefers `NEXT_PUBLIC_SITE_URL`, then {@link SITE_URL}.
 */
export function resolveProductionCheckoutOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  return SITE_URL;
}

/**
 * Returns whether a host is safe to use for preview/dev checkout redirects.
 *
 * @param host - Host header value (may include port)
 */
export function isAllowedPreviewCheckoutHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return PREVIEW_CHECKOUT_HOST_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
}

/**
 * Derives an HTTPS origin from reverse-proxy request headers.
 *
 * @param requestHeaders - Incoming request headers (`x-forwarded-host`, `host`, …)
 * @returns Origin when the host is allowed, otherwise `null`
 */
export function resolveCheckoutOriginFromHeaders(
  requestHeaders: Headers,
): string | null {
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host")?.trim();
  if (!host || !isAllowedPreviewCheckoutHost(host)) {
    return null;
  }

  const forwardedProto =
    requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const protocol = forwardedProto === "http" ? "http" : "https";

  return `${protocol}://${host.replace(/\/$/, "")}`;
}

export interface ResolveCheckoutOriginOptions {
  /** Request headers from the Pay-click server action. */
  headers?: Headers;
}

/**
 * Returns the HTTPS origin for checkout success/cancel URLs.
 *
 * - **Production** (`VERCEL_ENV=production`): always canonical — never `VERCEL_URL`
 *   or request host (prevents `*.vercel.app` leaks).
 * - **Preview / development**: prefers the browsed host from request headers,
 *   then `VERCEL_URL` on preview, then {@link SITE_URL}.
 * - **`NEXT_PUBLIC_SITE_URL`**: optional override on non-production when set.
 *
 * @param options - Optional request headers for preview/dev host resolution
 */
export function resolveCheckoutOrigin(
  options?: ResolveCheckoutOriginOptions,
): string {
  const vercelEnv = process.env.VERCEL_ENV?.trim();

  if (vercelEnv === "production") {
    return resolveProductionCheckoutOrigin();
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (options?.headers) {
    const fromHeaders = resolveCheckoutOriginFromHeaders(options.headers);
    if (fromHeaders) {
      return fromHeaders;
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel && vercelEnv === "preview") {
    return `https://${vercel.replace(/\/$/, "")}`;
  }

  return SITE_URL;
}
