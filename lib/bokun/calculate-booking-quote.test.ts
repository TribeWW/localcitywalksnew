/**
 * calculate-booking-quote — red/green TDD specs (LOC-1040 / LOC-1045).
 *
 * Critical invariant: each category picks its tier band using **only that
 * category's count**. Tests marked "per-category invariant" would fail (RED)
 * if implementation summed all guests before band lookup.
 */

import { describe, expect, it } from "vitest";
import type { BokunAvailability, BokunPricingCategory } from "@/types/bokun";
import {
  availabilityMatchesDate,
  calculateBookingQuote,
  findAvailabilitySlot,
  resolveWidgetCategoryMapping,
  type BookingWidgetCategoryMapping,
} from "@/lib/bokun/calculate-booking-quote";

const DEFAULT_RATE_ID = 2199582;
const SLOT_DATE = "2026-06-12";
const START_TIME_ID = 4252139;

/** Product 1079932 (Hello Biarritz) EUR bands from Phase 0 fixture. */
const BIARRITZ_CATEGORY_MAPPING: BookingWidgetCategoryMapping = {
  adults: 1045649,
  youth: 1045650,
  children: 1045651,
  infants: 1045652,
};

const BIARRITZ_PRICING_CATEGORIES: BokunPricingCategory[] = [
  { id: 1045649, title: "Adult", ticketCategory: "ADULT" },
  { id: 1045650, title: "Youth", ticketCategory: "TEENAGER" },
  { id: 1045651, title: "Child", ticketCategory: "CHILD" },
  { id: 1045652, title: "Infant", ticketCategory: "INFANT" },
];

const QUOTE_OPTIONS = {
  categoryMapping: BIARRITZ_CATEGORY_MAPPING,
  pricingCategories: BIARRITZ_PRICING_CATEGORIES,
};

function buildBiarritzPriceUnits() {
  return [
    {
      id: 1045649,
      amount: { amount: 248, currency: "EUR" },
      minParticipantsRequired: 1,
      maxParticipantsRequired: 1,
    },
    {
      id: 1045649,
      amount: { amount: 124, currency: "EUR" },
      minParticipantsRequired: 2,
      maxParticipantsRequired: 2,
    },
    {
      id: 1045649,
      amount: { amount: 114, currency: "EUR" },
      minParticipantsRequired: 3,
      maxParticipantsRequired: 3,
    },
    {
      id: 1045649,
      amount: { amount: 99, currency: "EUR" },
      minParticipantsRequired: 4,
      maxParticipantsRequired: 4,
    },
    {
      id: 1045649,
      amount: { amount: 89, currency: "EUR" },
      minParticipantsRequired: 5,
      maxParticipantsRequired: 6,
    },
    {
      id: 1045650,
      amount: { amount: 40, currency: "EUR" },
      minParticipantsRequired: 1,
      maxParticipantsRequired: 15,
    },
    {
      id: 1045651,
      amount: { amount: 0, currency: "EUR" },
      minParticipantsRequired: 1,
      maxParticipantsRequired: 15,
    },
    {
      id: 1045652,
      amount: { amount: 0, currency: "EUR" },
      minParticipantsRequired: 1,
      maxParticipantsRequired: 15,
    },
  ];
}

function buildBiarritzSlot(
  overrides: Partial<BokunAvailability> = {},
): BokunAvailability {
  return {
    id: "4252139_20260612",
    activityId: 1079932,
    startTimeId: START_TIME_ID,
    date: Date.parse(`${SLOT_DATE}T12:00:00.000Z`),
    localizedDate: SLOT_DATE,
    defaultRateId: DEFAULT_RATE_ID,
    pricesByRate: [
      {
        activityRateId: DEFAULT_RATE_ID,
        pricePerCategoryUnit: buildBiarritzPriceUnits(),
      },
    ],
    guidedLanguages: [],
    soldOut: false,
    ...overrides,
  };
}

const biarritzAvailabilities = [buildBiarritzSlot()];

function quote(
  participants: {
    adults: number;
    youth: number;
    children: number;
    infants: number;
  },
  availabilities = biarritzAvailabilities,
  options = QUOTE_OPTIONS,
) {
  return calculateBookingQuote(
    availabilities,
    SLOT_DATE,
    START_TIME_ID,
    participants,
    DEFAULT_RATE_ID,
    options,
  );
}

describe("resolveWidgetCategoryMapping", () => {
  it("maps all four pricingCategories to widget fields", () => {
    expect(resolveWidgetCategoryMapping(BIARRITZ_PRICING_CATEGORIES)).toEqual(
      BIARRITZ_CATEGORY_MAPPING,
    );
  });

  it("returns null when a required category is missing", () => {
    expect(
      resolveWidgetCategoryMapping([
        { id: 1045649, title: "Adult", ticketCategory: "ADULT" },
      ]),
    ).toBeNull();
  });
});

describe("findAvailabilitySlot", () => {
  it("matches by startTimeId and localizedDate", () => {
    expect(
      findAvailabilitySlot(biarritzAvailabilities, SLOT_DATE, START_TIME_ID),
    ).toEqual(buildBiarritzSlot());
  });

  it("returns null when start time does not match", () => {
    expect(
      findAvailabilitySlot(biarritzAvailabilities, SLOT_DATE, 999),
    ).toBeNull();
  });
});

describe("availabilityMatchesDate", () => {
  it("matches localizedDate when present", () => {
    expect(
      availabilityMatchesDate(
        { ...buildBiarritzSlot(), localizedDate: SLOT_DATE, date: 0 },
        SLOT_DATE,
      ),
    ).toBe(true);
  });
});

describe("calculateBookingQuote — per-category band lookup (LOC-1040)", () => {
  it("per-category invariant: 1 adult alone uses the 1-guest adult band (€248)", () => {
    const result = quote({ adults: 1, youth: 0, children: 0, infants: 0 });

    expect(result?.breakdown[0]).toMatchObject({
      categoryId: 1045649,
      count: 1,
      unitAmount: 248,
      lineTotal: 248,
    });
    expect(result?.totalAmount).toBe(248);
  });

  it("per-category invariant: adding youth does not change the adult band", () => {
    const solo = quote({ adults: 1, youth: 0, children: 0, infants: 0 });
    const withYouth = quote({ adults: 1, youth: 5, children: 0, infants: 0 });

    expect(withYouth?.breakdown[0]?.unitAmount).toBe(
      solo?.breakdown[0]?.unitAmount,
    );
    expect(withYouth?.breakdown[0]?.unitAmount).toBe(248);
    // Total-guest bug would pick the 5–6 band (€89/adult) → €289, not €448.
    expect(withYouth?.totalAmount).toBe(448);
  });

  it("per-category invariant: youth band uses youth count only (5 × €40)", () => {
    const result = quote({ adults: 1, youth: 5, children: 0, infants: 0 });

    expect(result?.breakdown[1]).toMatchObject({
      categoryId: 1045650,
      count: 5,
      unitAmount: 40,
      lineTotal: 200,
    });
  });

  it("returns €448 for 1 adult + 5 youth + 3 children + 2 infants", () => {
    expect(
      quote({ adults: 1, youth: 5, children: 3, infants: 2 }),
    ).toEqual({
      totalAmount: 448,
      currency: "EUR",
      source: "bokun-availability",
      breakdown: [
        {
          categoryId: 1045649,
          categoryLabel: "Adult",
          count: 1,
          unitAmount: 248,
          lineTotal: 248,
          currency: "EUR",
        },
        {
          categoryId: 1045650,
          categoryLabel: "Youth",
          count: 5,
          unitAmount: 40,
          lineTotal: 200,
          currency: "EUR",
        },
        {
          categoryId: 1045651,
          categoryLabel: "Child",
          count: 3,
          unitAmount: 0,
          lineTotal: 0,
          currency: "EUR",
        },
        {
          categoryId: 1045652,
          categoryLabel: "Infant",
          count: 2,
          unitAmount: 0,
          lineTotal: 0,
          currency: "EUR",
        },
      ],
    });
  });

  it("applies the 2-adult tier band (2 × €124)", () => {
    const result = quote({ adults: 2, youth: 0, children: 0, infants: 0 });

    expect(result?.totalAmount).toBe(248);
    expect(result?.breakdown[0]).toMatchObject({
      count: 2,
      unitAmount: 124,
      lineTotal: 248,
    });
  });

  it("applies the 5-adult tier band (5 × €89)", () => {
    const result = quote({ adults: 5, youth: 0, children: 0, infants: 0 });

    expect(result?.totalAmount).toBe(445);
    expect(result?.breakdown[0]).toMatchObject({
      count: 5,
      unitAmount: 89,
      lineTotal: 445,
    });
  });
});

describe("calculateBookingQuote — rejection paths", () => {
  it("returns null for zero participants", () => {
    expect(
      quote({ adults: 0, youth: 0, children: 0, infants: 0 }),
    ).toBeNull();
  });

  it("returns null for a sold-out slot", () => {
    expect(
      quote(
        { adults: 1, youth: 0, children: 0, infants: 0 },
        [buildBiarritzSlot({ soldOut: true })],
      ),
    ).toBeNull();
  });

  it("returns null for an unavailable slot", () => {
    expect(
      quote(
        { adults: 1, youth: 0, children: 0, infants: 0 },
        [buildBiarritzSlot({ unavailable: true })],
      ),
    ).toBeNull();
  });

  it("returns null when no availability matches date and start time", () => {
    expect(
      calculateBookingQuote(
        biarritzAvailabilities,
        "2026-06-13",
        START_TIME_ID,
        { adults: 1, youth: 0, children: 0, infants: 0 },
        DEFAULT_RATE_ID,
        QUOTE_OPTIONS,
      ),
    ).toBeNull();
  });

  it("returns null when category mapping cannot be resolved", () => {
    expect(
      calculateBookingQuote(
        biarritzAvailabilities,
        SLOT_DATE,
        START_TIME_ID,
        { adults: 1, youth: 0, children: 0, infants: 0 },
        DEFAULT_RATE_ID,
      ),
    ).toBeNull();
  });

  it("returns null when count exceeds available tier bands", () => {
    expect(
      quote({ adults: 16, youth: 0, children: 0, infants: 0 }),
    ).toBeNull();
  });
});

describe("calculateBookingQuote — category resolution", () => {
  it("resolves mapping from pricingCategories when explicit mapping omitted", () => {
    const result = calculateBookingQuote(
      biarritzAvailabilities,
      SLOT_DATE,
      START_TIME_ID,
      { adults: 1, youth: 0, children: 0, infants: 0 },
      DEFAULT_RATE_ID,
      { pricingCategories: BIARRITZ_PRICING_CATEGORIES },
    );

    expect(result?.totalAmount).toBe(248);
    expect(result?.breakdown[0]?.categoryLabel).toBe("Adult");
  });
});
