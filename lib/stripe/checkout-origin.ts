/**
 * Resolves the public site origin for Stripe redirect URLs (LOC-1161).
 */

import { SITE_URL } from "@/lib/site";

/**
 * Returns the canonical HTTPS origin for checkout success/cancel URLs.
 *
 * Prefers `NEXT_PUBLIC_SITE_URL`, then `VERCEL_URL`, then {@link SITE_URL}.
 */
export function resolveCheckoutOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }

  return SITE_URL;
}
