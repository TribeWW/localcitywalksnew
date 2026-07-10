/**
 * resolveMaxGroupSize — unit specs.
 */

import { describe, expect, it } from "vitest";
import type { BokunAvailability } from "@/types/bokun";
import { resolveMaxGroupSize } from "@/lib/bokun/resolve-max-group-size";

function buildSlot(
  overrides: Partial<BokunAvailability> = {},
): BokunAvailability {
  return {
    id: "4252139_20260612",
    activityId: 1079932,
    startTimeId: 4252139,
    date: 1781222400000,
    defaultRateId: 2116654,
    rates: [{ id: 2116654, minPerBooking: 1, maxPerBooking: 15 }],
    pricesByRate: [],
    guidedLanguages: [],
    soldOut: false,
    ...overrides,
  };
}

describe("resolveMaxGroupSize", () => {
  it("returns maxPerBooking for the default rate", () => {
    expect(resolveMaxGroupSize(buildSlot(), 2116654)).toBe(15);
  });

  it("falls back to slot.defaultRateId when defaultRateId arg is omitted", () => {
    expect(resolveMaxGroupSize(buildSlot())).toBe(15);
  });

  it("returns null when rates are missing", () => {
    expect(resolveMaxGroupSize(buildSlot({ rates: undefined }))).toBeNull();
  });

  it("returns null when maxPerBooking is not a positive integer", () => {
    expect(
      resolveMaxGroupSize(
        buildSlot({
          rates: [{ id: 2116654, maxPerBooking: 0 }],
        }),
      ),
    ).toBeNull();
  });
});
