/**
 * Delivery ledger unit tests — idempotency key and resume semantics.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { BookingWidgetEmailContent } from "@/lib/nodemailer/booking-widget-email";
import {
  buildBookingWidgetEmailDeliveryKey,
  getBookingWidgetEmailDeliveryState,
  markBookingWidgetEmailDelivered,
  resetBookingWidgetEmailDeliveryLedger,
} from "@/lib/nodemailer/booking-widget-email-delivery-ledger";

const samplePayload: BookingWidgetEmailContent = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  consent: true,
  city: "Toledo",
  productId: "1079932",
  productTitle: "Hello Toledo Private Walk",
  date: "2026-07-15",
  startTimeId: 12345,
  startTimeLabel: "11:00",
  adults: 2,
  youth: 0,
  children: 0,
  infants: 0,
  totalAmount: 248,
  currency: "EUR",
};

describe("buildBookingWidgetEmailDeliveryKey", () => {
  it("is stable for the same booking slot and participants", () => {
    const keyA = buildBookingWidgetEmailDeliveryKey(samplePayload);
    const keyB = buildBookingWidgetEmailDeliveryKey({
      ...samplePayload,
      fullName: "Different Name",
      message: "optional note",
    });

    expect(keyA).toBe(keyB);
  });

  it("differs when slot, email, or price changes", () => {
    const base = buildBookingWidgetEmailDeliveryKey(samplePayload);

    expect(
      buildBookingWidgetEmailDeliveryKey({
        ...samplePayload,
        startTimeId: 99999,
      }),
    ).not.toBe(base);
    expect(
      buildBookingWidgetEmailDeliveryKey({
        ...samplePayload,
        email: "other@example.com",
      }),
    ).not.toBe(base);
    expect(
      buildBookingWidgetEmailDeliveryKey({
        ...samplePayload,
        totalAmount: 300,
      }),
    ).not.toBe(base);
  });
});

describe("booking widget email delivery ledger", () => {
  beforeEach(() => {
    resetBookingWidgetEmailDeliveryLedger();
  });

  it("starts with both legs undelivered", () => {
    const key = buildBookingWidgetEmailDeliveryKey(samplePayload);
    expect(getBookingWidgetEmailDeliveryState(key)).toEqual(
      expect.objectContaining({ team: false, customer: false }),
    );
  });

  it("records team and customer legs independently", () => {
    const key = buildBookingWidgetEmailDeliveryKey(samplePayload);

    markBookingWidgetEmailDelivered(key, "team");

    expect(getBookingWidgetEmailDeliveryState(key)).toEqual(
      expect.objectContaining({ team: true, customer: false }),
    );

    markBookingWidgetEmailDelivered(key, "customer");

    expect(getBookingWidgetEmailDeliveryState(key)).toEqual(
      expect.objectContaining({ team: true, customer: true }),
    );
  });
});
