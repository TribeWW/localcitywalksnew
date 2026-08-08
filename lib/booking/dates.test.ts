/**
 * booking/dates — UTC calendar date for Bókun availability slots.
 */

import { describe, expect, it } from "vitest";
import { availabilitySlotToIsoDate } from "@/lib/booking/dates";
import type { BokunAvailability } from "@/types/bokun";

function slot(date: number): BokunAvailability {
  return {
    id: "4252139_20260615",
    activityId: 1079932,
    startTimeId: 4252139,
    date,
    pricesByRate: [],
    guidedLanguages: [],
    soldOut: false,
  };
}

describe("availabilitySlotToIsoDate", () => {
  it("derives YYYY-MM-DD from the UTC ISO representation", () => {
    expect(
      availabilitySlotToIsoDate(slot(Date.UTC(2026, 5, 15, 12, 0, 0))),
    ).toBe("2026-06-15");
    expect(
      availabilitySlotToIsoDate(slot(Date.parse("2026-07-15T22:00:00.000Z"))),
    ).toBe("2026-07-15");
  });

  it("does not shift the calendar date under a negative-offset timezone", () => {
    // 2026-06-15T00:00:00.000Z is still 2026-06-14 evening in America/Los_Angeles.
    const epoch = Date.UTC(2026, 5, 15, 0, 0, 0);
    const localInLosAngeles = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(epoch));

    expect(localInLosAngeles).toBe("2026-06-14");
    expect(availabilitySlotToIsoDate(slot(epoch))).toBe("2026-06-15");
    expect(availabilitySlotToIsoDate(slot(epoch))).not.toBe(localInLosAngeles);
  });
});
