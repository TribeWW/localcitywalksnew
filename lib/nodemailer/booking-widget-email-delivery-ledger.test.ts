/**
 * Delivery ledger unit tests — idempotency key and resume semantics.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingWidgetEmailContent } from "@/lib/nodemailer/booking-widget-email";
import {
  buildBookingWidgetEmailDeliveryKey,
  getBookingWidgetEmailDeliveryLedgerSizeForTests,
  getBookingWidgetEmailDeliveryState,
  markBookingWidgetEmailDelivered,
  resetBookingWidgetEmailDeliveryLedger,
  runWithBookingWidgetEmailDeliveryLock,
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

  it("prunes expired entries globally without re-accessing each key", () => {
    vi.useFakeTimers();

    const key1 = buildBookingWidgetEmailDeliveryKey(samplePayload);
    const key2 = buildBookingWidgetEmailDeliveryKey({
      ...samplePayload,
      startTimeId: 11111,
    });
    const key3 = buildBookingWidgetEmailDeliveryKey({
      ...samplePayload,
      startTimeId: 22222,
    });

    markBookingWidgetEmailDelivered(key1, "team");
    markBookingWidgetEmailDelivered(key2, "team");
    expect(getBookingWidgetEmailDeliveryLedgerSizeForTests()).toBe(2);

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

    getBookingWidgetEmailDeliveryState(key3);

    expect(getBookingWidgetEmailDeliveryLedgerSizeForTests()).toBe(0);

    vi.useRealTimers();
  });

  it("serializes concurrent tasks for the same booking key", async () => {
    const key = buildBookingWidgetEmailDeliveryKey(samplePayload);
    const order: number[] = [];

    const first = runWithBookingWidgetEmailDeliveryLock(key, async () => {
      order.push(1);
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push(2);
    });

    const second = runWithBookingWidgetEmailDeliveryLock(key, async () => {
      order.push(3);
    });

    await Promise.all([first, second]);

    expect(order).toEqual([1, 2, 3]);
  });
});
