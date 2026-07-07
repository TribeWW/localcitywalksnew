/**
 * checkout-pay-integration-fixture — red/green TDD specs (LOC-1164 / PRD Task 3.6).
 */

import { describe, expect, it } from "vitest";
import type { BokunAvailability } from "@/types/bokun";
import {
  CHECKOUT_PAY_INTEGRATION_PARTICIPANTS,
  pickFirstBookableAvailabilitySlot,
  toAvailabilityIsoDate,
} from "@/lib/checkout/checkout-pay-integration-fixture";

function buildSlot(
  overrides: Partial<BokunAvailability> = {},
): BokunAvailability {
  return {
    id: "4252139_20260715",
    activityId: 15686,
    startTimeId: 4252139,
    date: Date.parse("2026-07-15T10:00:00.000Z"),
    pricesByRate: [],
    guidedLanguages: ["en"],
    soldOut: false,
    ...overrides,
  };
}

describe("pickFirstBookableAvailabilitySlot", () => {
  it("returns the first slot that is not sold out or unavailable", () => {
    const slots = [
      buildSlot({ soldOut: true, startTimeId: 1 }),
      buildSlot({ unavailable: true, startTimeId: 2 }),
      buildSlot({ startTimeId: 4252139 }),
    ];

    expect(pickFirstBookableAvailabilitySlot(slots)?.startTimeId).toBe(4252139);
  });

  it("returns null when every slot is unavailable", () => {
    expect(
      pickFirstBookableAvailabilitySlot([
        buildSlot({ soldOut: true }),
        buildSlot({ unavailable: true }),
      ]),
    ).toBeNull();
  });
});

describe("toAvailabilityIsoDate", () => {
  it("formats Bókun epoch slot dates as YYYY-MM-DD", () => {
    expect(toAvailabilityIsoDate(Date.parse("2026-07-15T22:00:00.000Z"))).toBe(
      "2026-07-15",
    );
  });
});

describe("CHECKOUT_PAY_INTEGRATION_PARTICIPANTS", () => {
  it("uses a single adult for the spike product", () => {
    expect(CHECKOUT_PAY_INTEGRATION_PARTICIPANTS).toEqual({
      adults: 1,
      youth: 0,
      children: 0,
      infants: 0,
    });
  });
});
