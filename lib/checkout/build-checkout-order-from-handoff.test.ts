/**
 * buildCheckoutOrderFromHandoff — display mapping tests (LOC-1154).
 */

import { describe, expect, it } from "vitest";
import type { CheckoutHandoffPayload } from "@/lib/checkout/handoff-token";
import {
  buildCheckoutOrderFromHandoff,
  formatCheckoutDateLabel,
} from "@/lib/checkout/build-checkout-order-from-handoff";
import type { BookingWidgetQuote } from "@/types/bokun";

const payload: CheckoutHandoffPayload = {
  v: 1,
  exp: 1_900_000_000,
  productId: "1079932",
  date: "2026-07-15",
  startTimeId: 4252139,
  participants: { adults: 2, youth: 0, children: 1, infants: 0 },
  language: "en",
  clientQuote: { totalAmount: 448, currency: "EUR" },
  productTitle: "Hello Biarritz",
};

const serverQuote: BookingWidgetQuote = {
  totalAmount: 496,
  currency: "EUR",
  source: "bokun-availability",
  breakdown: [],
};

describe("formatCheckoutDateLabel", () => {
  it("formats ISO dates for the order summary card", () => {
    expect(formatCheckoutDateLabel("2026-07-15")).toMatch(/Jul/);
    expect(formatCheckoutDateLabel("2026-07-15")).toMatch(/2026/);
  });
});

describe("buildCheckoutOrderFromHandoff", () => {
  it("uses server-verified quote totals, not the handoff clientQuote snapshot", () => {
    const order = buildCheckoutOrderFromHandoff({
      payload,
      quote: serverQuote,
      productTitle: "Hello Biarritz",
      imageUrl: "https://cdn.example/tour.jpg",
      startTimeLabel: "11:00",
    });

    expect(order.totalAmount).toBe(496);
    expect(order.currency).toBe("EUR");
    expect(order.title).toBe("Hello Biarritz");
    expect(order.dateLabel).toBe(formatCheckoutDateLabel("2026-07-15"));
    expect(order.timeLabel).toBe("11:00");
    expect(order.participantsLabel).toBe("2 adults, 1 child");
    expect(order.imageUrl).toBe("https://cdn.example/tour.jpg");
  });
});
