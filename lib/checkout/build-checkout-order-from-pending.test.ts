/**
 * buildCheckoutOrderFromPending — red/green TDD specs (LOC-1167 / PRD Task 4.3).
 */

import { describe, expect, it } from "vitest";
import type { PendingCheckoutRecord } from "@/lib/checkout/pending-checkout-store";
import { buildCheckoutOrderFromPending } from "@/lib/checkout/build-checkout-order-from-pending";

const pending: PendingCheckoutRecord = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "paid",
  productId: "1079932",
  date: "2026-07-15",
  startTimeId: 4252139,
  participants: { adults: 2, youth: 0, children: 1, infants: 0 },
  quoteSnapshot: {
    totalAmount: 496,
    currency: "EUR",
    source: "bokun-availability",
    breakdown: [],
  },
  contact: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    termsAcceptedAt: "2026-07-06T10:00:00.000Z",
  },
  stripeSessionId: "cs_test_123",
  productConfirmationCode: "LOC-P456",
  createdAt: "2026-07-06T10:00:00.000Z",
  expiresAt: "2026-07-06T10:30:00.000Z",
};

describe("buildCheckoutOrderFromPending", () => {
  it("maps KV row + tour display metadata into CheckoutOrderFixture", () => {
    expect(
      buildCheckoutOrderFromPending({
        pending,
        productTitle: "Hello Biarritz",
        imageUrl: "https://cdn.example/photo.jpg",
        startTimeLabel: "11:00",
      }),
    ).toEqual({
      imageUrl: "https://cdn.example/photo.jpg",
      imageAlt: "Hello Biarritz",
      title: "Hello Biarritz",
      dateLabel: "Wed, 15 Jul 2026",
      timeLabel: "11:00",
      participantsLabel: "2 adults, 1 child",
      totalAmount: 496,
      currency: "EUR",
    });
  });
});
