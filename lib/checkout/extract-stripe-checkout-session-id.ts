/**
 * Extracts a Stripe Checkout Session id from a hosted redirect URL (LOC-1164).
 *
 * @param redirectUrl - Stripe hosted Checkout URL returned by Pay initiation
 */
export function extractStripeCheckoutSessionId(
  redirectUrl: string,
): string | null {
  const match = redirectUrl.match(/\/pay\/(cs_[A-Za-z0-9_]+)/);
  return match?.[1] ?? null;
}
