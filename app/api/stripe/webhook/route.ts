import { NextResponse } from "next/server";

import { processStripeWebhookRequest } from "@/lib/stripe/process-stripe-webhook-request";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook endpoint (LOC-1165 / PRD Task 4.2).
 *
 * Verifies `stripe-signature`, handles `checkout.session.completed` by marking
 * the pending checkout paid (idempotent), and returns HTTP statuses that
 * control Stripe retry behaviour.
 *
 * POST /api/stripe/webhook
 * Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const result = await processStripeWebhookRequest(payload, signature);

  return NextResponse.json(result.body, { status: result.status });
}
