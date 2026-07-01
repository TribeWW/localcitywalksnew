/**
 * Static Hello Palma checkout fixture for Phase 1 mockup (LOC-1148).
 *
 * Single-tour data from design brief §3.6 — production v1 is one tour per checkout.
 */

/** Order recap fields shared by summary and success views. */
export interface CheckoutOrderFixture {
  imageUrl: string;
  imageAlt: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  participantsLabel: string;
  totalAmount: number;
  currency: string;
}

/** Hello Palma de Mallorca — design brief §3.6 (first cart item only). */
export const HELLO_PALMA_CHECKOUT_FIXTURE: CheckoutOrderFixture = {
  imageUrl:
    "https://cdn.magicpatterns.com/uploads/kFrUBcxAc2mtAoEPQtWDGQ/cathedral-santa-maria-palma-also-la-seu-is-gothic-roman-catholic-cathedral-located-palma-mallorca-spain.jpg",
  imageAlt: "Palma de Mallorca cathedral",
  title:
    "Hello Palma de Mallorca: Private 2-Hour Intro City Walk with Local Guide",
  dateLabel: "Wed, 21 Mar 2026",
  timeLabel: "11:00 AM",
  participantsLabel: "4 adults, 2 children, 1 infant",
  totalAmount: 496,
  currency: "EUR",
};

/** Mock booking reference for success screen (design brief §4). */
export const MOCK_BOOKING_REFERENCE = "LCW-2026-48291";

/** Success hero illustration from design brief §6. */
export const CHECKOUT_SUCCESS_ILLUSTRATION_URL =
  "https://cdn.magicpatterns.com/uploads/qSvXdvPBwSgs5b5AQjtR1X/ChatGPT_Image_May_5,_2026,_10_53_39_PM.svg";
