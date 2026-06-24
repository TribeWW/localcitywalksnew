/**
 * booking-widget email templates — red/green TDD specs (LOC-1055).
 *
 * Critical invariants:
 * - User-controlled strings are HTML-escaped
 * - Team email includes price, infants, and consent; omits internal Bókun ids
 * - Customer email mirrors selections + verified total; omits internal ids
 * - Optional fields (message, phone, language, duration) omitted when empty
 * - Breakdown renders Free for zero line totals
 */

import { describe, expect, it } from "vitest";
import {
  buildBookingWidgetCustomerHtml,
  buildBookingWidgetCustomerSubject,
  buildBookingWidgetTeamHtml,
  buildBookingWidgetTeamSubject,
  escapeHtml,
  formatBookingParticipantSummary,
  formatBookingWidgetEmailDate,
  totalParticipantCount,
  type BookingWidgetEmailContent,
} from "@/lib/nodemailer/booking-widget-email";

const samplePayload: BookingWidgetEmailContent = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phoneNumber: "+34123456789",
  message: "We prefer a slow pace.",
  consent: true,
  city: "Toledo",
  productId: "1079932",
  productTitle: "Hello Toledo Private Walk",
  date: "2026-07-15",
  startTimeId: 12345,
  startTimeLabel: "11:00",
  language: "EN_GB",
  durationText: "2 hours",
  adults: 2,
  youth: 0,
  children: 1,
  infants: 1,
  totalAmount: 448,
  currency: "EUR",
  breakdown: [
    {
      categoryLabel: "Adult",
      count: 2,
      lineTotal: 248,
      currency: "EUR",
    },
    {
      categoryLabel: "Child",
      count: 1,
      lineTotal: 0,
      currency: "EUR",
    },
    {
      categoryLabel: "Infant",
      count: 1,
      lineTotal: 0,
      currency: "EUR",
    },
  ],
};

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<script>"x"&</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot;&amp;&lt;/script&gt;",
    );
  });
});

describe("formatBookingWidgetEmailDate", () => {
  it("formats ISO dates in long weekday style", () => {
    expect(formatBookingWidgetEmailDate("2026-07-15")).toContain("July");
    expect(formatBookingWidgetEmailDate("2026-07-15")).toContain("2026");
  });
});

describe("formatBookingParticipantSummary", () => {
  it("lists non-zero categories with correct pluralization", () => {
    expect(
      formatBookingParticipantSummary({
        adults: 2,
        youth: 0,
        children: 1,
        infants: 1,
      }),
    ).toBe("2 adults, 1 child, 1 infant");
  });

  it("uses singular labels for count of 1", () => {
    expect(
      formatBookingParticipantSummary({
        adults: 1,
        youth: 0,
        children: 0,
        infants: 0,
      }),
    ).toBe("1 adult");
  });
});

describe("totalParticipantCount", () => {
  it("sums all participant categories", () => {
    expect(
      totalParticipantCount({
        adults: 2,
        youth: 1,
        children: 1,
        infants: 1,
      }),
    ).toBe(5);
  });
});

describe("buildBookingWidgetTeamSubject", () => {
  it("includes product, city, and formatted total", () => {
    const subject = buildBookingWidgetTeamSubject(samplePayload);

    expect(subject).toContain("Hello Toledo Private Walk");
    expect(subject).toContain("Toledo");
    expect(subject).toContain("€448");
  });
});

describe("buildBookingWidgetTeamHtml — display invariants", () => {
  it("ops invariant: includes infants and consent; omits internal Bókun ids", () => {
    const html = buildBookingWidgetTeamHtml(samplePayload);

    expect(html).not.toContain("Bókun product id");
    expect(html).not.toContain("1079932");
    expect(html).not.toContain("Bókun start time id");
    expect(html).not.toContain("<strong>Bókun start time id:</strong>");
    expect(html).toContain("Infants (0–2)");
    expect(html).toContain("Consent given:</strong> Yes");
  });

  it("pricing invariant: shows total, tax copy, and breakdown lines", () => {
    const html = buildBookingWidgetTeamHtml(samplePayload);

    expect(html).toContain("€448");
    expect(html).toContain("Price includes all taxes and fees");
    expect(html).toContain("Adult × 2");
    expect(html).toContain("Free");
  });

  it("escape invariant: escapes user-controlled HTML in contact and message", () => {
    const html = buildBookingWidgetTeamHtml({
      ...samplePayload,
      fullName: `<Jane>`,
      message: `Prefer "quiet" corners & alleys`,
    });

    expect(html).not.toContain("<Jane>");
    expect(html).toContain("&lt;Jane&gt;");
    expect(html).toContain("Prefer &quot;quiet&quot; corners &amp; alleys");
  });

  it("optional invariant: omits message block when message is blank", () => {
    const html = buildBookingWidgetTeamHtml({
      ...samplePayload,
      message: "   ",
    });

    expect(html).not.toContain('<h4 style="color: #856404; margin-top: 0;">Message</h4>');
  });

  it("optional invariant: shows Not provided when phone is missing", () => {
    const html = buildBookingWidgetTeamHtml({
      ...samplePayload,
      phoneNumber: undefined,
    });

    expect(html).toContain("Not provided");
  });
});

describe("buildBookingWidgetCustomerHtml — display invariants", () => {
  it("customer invariant: mirrors selections and total without internal Bókun ids", () => {
    const html = buildBookingWidgetCustomerHtml(samplePayload);

    expect(html).toContain("Thanks for your tour request");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Hello Toledo Private Walk");
    expect(html).toContain("€448");
    expect(html).toContain("2 adults, 1 child, 1 infant");
    expect(html).toContain("English");
    expect(html).not.toContain("Bókun product id");
    expect(html).not.toContain("start time id");
  });

  it("optional invariant: omits language and duration when not provided", () => {
    const html = buildBookingWidgetCustomerHtml({
      ...samplePayload,
      language: undefined,
      durationText: undefined,
    });

    expect(html).not.toContain("<strong>Language:</strong>");
    expect(html).not.toContain("<strong>Duration:</strong>");
  });
});

describe("buildBookingWidgetCustomerSubject", () => {
  it("includes the tour city", () => {
    expect(buildBookingWidgetCustomerSubject(samplePayload)).toBe(
      "Your LocalCityWalks tour request — Toledo",
    );
  });
});
