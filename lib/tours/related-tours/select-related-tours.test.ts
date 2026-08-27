import { describe, expect, it } from "vitest";

import { selectRelatedTours } from "@/lib/tours/related-tours/select-related-tours";
import type { CityCardData } from "@/types/bokun";

function card(
  partial: Pick<CityCardData, "id" | "title"> &
    Partial<Omit<CityCardData, "id" | "title">>,
): CityCardData {
  return {
    image: "/img.jpg",
    ...partial,
  };
}

/** Provence-style catalog already sorted A→Z by title (as the explore snapshot is). */
const PROVENCE_CATALOG: CityCardData[] = [
  card({
    id: "1",
    title: "Aix Walk",
    citySlug: "aix-en-provence",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "2",
    title: "Arles Walk",
    citySlug: "arles",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "3",
    title: "Avignon Old Town",
    citySlug: "avignon",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "4",
    title: "Avignon Story",
    citySlug: "avignon",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "5",
    title: "Bordeaux Walk",
    citySlug: "bordeaux",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "6",
    title: "Lyon Walk",
    citySlug: "lyon",
    countryCode: "FR",
    country: "France",
  }),
  card({
    id: "10",
    title: "Madrid Walk",
    citySlug: "madrid",
    countryCode: "ES",
    country: "Spain",
  }),
  card({
    id: "20",
    title: "Spotlight Extra A",
    citySlug: "rome",
    countryCode: "IT",
    country: "Italy",
  }),
  card({
    id: "21",
    title: "Spotlight Extra B",
    citySlug: "florence",
    countryCode: "IT",
    country: "Italy",
  }),
];

const PROVENCE_SLUGS = ["aix-en-provence", "arles", "avignon"];

describe("selectRelatedTours", () => {
  it("fills 4 from same city + region without entering country (region heading)", () => {
    const catalog = [
      ...PROVENCE_CATALOG,
      card({
        id: "7",
        title: "Avignon Bridge",
        citySlug: "avignon",
        countryCode: "FR",
        country: "France",
      }),
      card({
        id: "8",
        title: "Avignon Palace",
        citySlug: "avignon",
        countryCode: "FR",
        country: "France",
      }),
    ].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );

    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: PROVENCE_SLUGS,
      catalog,
      spotlightIds: ["20", "21"],
      regionName: "Provence",
      countryName: "France",
    });

    expect(result).not.toBeNull();
    expect(result!.cards.map((c) => c.id)).toEqual(["7", "8", "4", "1"]);
    expect(result!.heading).toBe("Explore more of Provence");
    expect(result!.deepestTier).toBe(2);
  });

  it("uses country round when city+region cannot fill 4 (compound heading)", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: PROVENCE_SLUGS,
      catalog: PROVENCE_CATALOG,
      spotlightIds: ["20"],
      regionName: "Provence",
      countryName: "France",
    });

    expect(result).not.toBeNull();
    // Tier1: id 4 (same city). Tier2: 1 Aix, 2 Arles. Tier3: needs 1 more — scan from start, skip picked → Bordeaux (5).
    expect(result!.cards.map((c) => c.id)).toEqual(["4", "1", "2", "5"]);
    expect(result!.heading).toBe("Explore Provence and more of France");
    expect(result!.deepestTier).toBe(3);
  });

  it("scans country list from the start even when region already picked earlier titles", () => {
    // Region already has Aix; country round must still start at A and skip Aix + current Avignon.
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: ["aix-en-provence", "avignon"],
      catalog: PROVENCE_CATALOG,
      spotlightIds: [],
      regionName: "Provence",
      countryName: "France",
    });

    expect(result).not.toBeNull();
    // Tier1: 4. Tier2: 1 Aix. Tier3 from start: skip 1+3+4 → Arles(2), Bordeaux(5), Lyon(6)
    expect(result!.cards.map((c) => c.id)).toEqual(["4", "1", "2", "5"]);
    expect(result!.deepestTier).toBe(3);
  });

  it("fills remaining slots from Home Spotlight in editorial order", () => {
    const thinCatalog = [
      card({
        id: "3",
        title: "Avignon Old Town",
        citySlug: "avignon",
        countryCode: "FR",
        country: "France",
      }),
      card({
        id: "4",
        title: "Avignon Story",
        citySlug: "avignon",
        countryCode: "FR",
        country: "France",
      }),
      card({
        id: "20",
        title: "Spotlight Extra A",
        citySlug: "rome",
        countryCode: "IT",
        country: "Italy",
      }),
      card({
        id: "21",
        title: "Spotlight Extra B",
        citySlug: "florence",
        countryCode: "IT",
        country: "Italy",
      }),
      card({
        id: "22",
        title: "Spotlight Extra C",
        citySlug: "venice",
        countryCode: "IT",
        country: "Italy",
      }),
    ];

    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: ["avignon"],
      catalog: thinCatalog,
      spotlightIds: ["22", "21", "20"],
      regionName: "Provence",
      countryName: "France",
    });

    expect(result).not.toBeNull();
    // Tier1: 4. Tiers 2–3 empty of new cards. Spotlight: 22, 21, 20 (editorial, not A→Z).
    expect(result!.cards.map((c) => c.id)).toEqual(["4", "22", "21", "20"]);
    expect(result!.heading).toBe("Popular with other travellers");
    expect(result!.deepestTier).toBe(4);
  });

  it("skips tier 2 only when hasRegion is false; heading is country override", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: false,
      regionCitySlugs: PROVENCE_SLUGS,
      catalog: PROVENCE_CATALOG,
      spotlightIds: ["20"],
      regionName: null,
      countryName: "France",
    });

    expect(result).not.toBeNull();
    // Tier1 same-city: 4. Skip tier2. Tier3 country: Aix, Arles, Bordeaux (not region-only filter).
    expect(result!.cards.map((c) => c.id)).toEqual(["4", "1", "2", "5"]);
    expect(result!.heading).toBe("Explore more of France");
    expect(result!.deepestTier).toBe(3);
  });

  it("still picks same-city when hasRegion is false", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: [
        card({
          id: "3",
          title: "Avignon Old Town",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "4",
          title: "Avignon Story",
          citySlug: "avignon",
          countryCode: "FR",
        }),
      ],
      spotlightIds: [],
      regionName: null,
      countryName: "France",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["4"]);
    expect(result!.heading).toBe("Explore more of France");
  });

  it("uses region heading when tier 1 alone fills 4 (region exists, country never entered)", () => {
    const catalog = [
      card({
        id: "3",
        title: "Avignon Old Town",
        citySlug: "avignon",
        countryCode: "FR",
      }),
      card({
        id: "4",
        title: "Avignon A",
        citySlug: "avignon",
        countryCode: "FR",
      }),
      card({
        id: "5",
        title: "Avignon B",
        citySlug: "avignon",
        countryCode: "FR",
      }),
      card({
        id: "6",
        title: "Avignon C",
        citySlug: "avignon",
        countryCode: "FR",
      }),
      card({
        id: "7",
        title: "Avignon D",
        citySlug: "avignon",
        countryCode: "FR",
      }),
    ].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );

    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: ["avignon"],
      catalog,
      spotlightIds: ["20"],
      regionName: "Provence",
      countryName: "France",
    });

    expect(result!.cards).toHaveLength(4);
    expect(result!.deepestTier).toBe(1);
    expect(result!.heading).toBe("Explore more of Provence");
  });

  it("skips the current product when it appears in spotlight ids", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "lonely-city",
      countryCode: "XX",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: [
        card({
          id: "3",
          title: "Lonely Tour",
          citySlug: "lonely-city",
          countryCode: "XX",
        }),
        card({
          id: "20",
          title: "Spotlight Extra A",
          citySlug: "rome",
          countryCode: "IT",
        }),
      ],
      spotlightIds: ["3", "20"],
      regionName: null,
      countryName: "Nowhere",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["20"]);
    expect(result!.deepestTier).toBe(4);
  });

  it("skips spotlight ids missing from the catalog", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "lonely-city",
      countryCode: "XX",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: [
        card({
          id: "3",
          title: "Lonely Tour",
          citySlug: "lonely-city",
          countryCode: "XX",
        }),
        card({
          id: "20",
          title: "Spotlight Extra A",
          citySlug: "rome",
          countryCode: "IT",
        }),
      ],
      spotlightIds: ["999", "20"],
      regionName: null,
      countryName: "Nowhere",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["20"]);
  });

  it("returns 1–3 cards when fewer than max are available", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: [
        card({
          id: "3",
          title: "Avignon Old Town",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "4",
          title: "Avignon Story",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "5",
          title: "Bordeaux Walk",
          citySlug: "bordeaux",
          countryCode: "FR",
        }),
      ],
      spotlightIds: [],
      regionName: null,
      countryName: "France",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["4", "5"]);
  });

  it("returns null when no other products remain after all tiers", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: ["avignon"],
      catalog: [
        card({
          id: "3",
          title: "Avignon Old Town",
          citySlug: "avignon",
          countryCode: "FR",
        }),
      ],
      spotlightIds: ["3", "999"],
      regionName: "Provence",
      countryName: "France",
    });

    expect(result).toBeNull();
  });

  it("skips tiers 1–3 when countryCode is blank; spotlight only", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "  ",
      hasRegion: true,
      regionCitySlugs: PROVENCE_SLUGS,
      catalog: PROVENCE_CATALOG,
      spotlightIds: ["20", "21"],
      regionName: "Provence",
      countryName: "France",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["20", "21"]);
    expect(result!.heading).toBe("Popular with other travellers");
    expect(result!.deepestTier).toBe(4);
  });

  it("matches country codes case-insensitively and trims", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: " fr ",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: PROVENCE_CATALOG,
      spotlightIds: [],
      regionName: null,
      countryName: "France",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["4", "1", "2", "5"]);
  });

  it("treats missing region name as no-region for heading only", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: PROVENCE_SLUGS,
      catalog: PROVENCE_CATALOG,
      spotlightIds: [],
      regionName: "  ",
      countryName: "France",
    });

    // Selection still uses region slugs (tier 2), but heading uses country override.
    expect(result!.cards.map((c) => c.id)).toEqual(["4", "1", "2", "5"]);
    expect(result!.deepestTier).toBe(3);
    expect(result!.heading).toBe("Explore more of France");
  });

  it("keeps Popular heading when spotlight is entered but adds nothing (has region)", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: true,
      regionCitySlugs: ["avignon"],
      catalog: [
        card({
          id: "3",
          title: "Avignon Old Town",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "4",
          title: "Avignon Story",
          citySlug: "avignon",
          countryCode: "FR",
        }),
      ],
      spotlightIds: ["3", "999"],
      regionName: "Provence",
      countryName: "France",
    });

    // Entered tier 4 because still short; adds nothing; deepest tier still drives heading.
    expect(result!.cards.map((c) => c.id)).toEqual(["4"]);
    expect(result!.deepestTier).toBe(4);
    expect(result!.heading).toBe("Popular with other travellers");
  });

  it("keeps country heading when no-region and spotlight adds nothing", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: [
        card({
          id: "3",
          title: "Avignon Old Town",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "4",
          title: "Avignon Story",
          citySlug: "avignon",
          countryCode: "FR",
        }),
      ],
      spotlightIds: ["3", "999"],
      regionName: null,
      countryName: "France",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["4"]);
    expect(result!.deepestTier).toBe(4);
    expect(result!.heading).toBe("Explore more of France");
  });

  it("skips already-picked ids when resolving spotlight", () => {
    const result = selectRelatedTours({
      currentProductId: "3",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: [
        card({
          id: "3",
          title: "Avignon Old Town",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "4",
          title: "Avignon Story",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "20",
          title: "Spotlight Extra A",
          citySlug: "rome",
          countryCode: "IT",
        }),
        card({
          id: "21",
          title: "Spotlight Extra B",
          citySlug: "florence",
          countryCode: "IT",
        }),
      ],
      // 4 already picked in tier 1; spotlight must skip it and take 20 then 21.
      spotlightIds: ["4", "20", "21"],
      regionName: null,
      countryName: "France",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["4", "20", "21"]);
    expect(result!.deepestTier).toBe(4);
  });

  it("normalizes current id via digit coercion so numeric-shaped strings match", () => {
    const result = selectRelatedTours({
      currentProductId: "prod-4",
      citySlug: "avignon",
      countryCode: "FR",
      hasRegion: false,
      regionCitySlugs: [],
      catalog: [
        card({
          id: "4",
          title: "Avignon Story",
          citySlug: "avignon",
          countryCode: "FR",
        }),
        card({
          id: "5",
          title: "Bordeaux Walk",
          citySlug: "bordeaux",
          countryCode: "FR",
        }),
      ],
      spotlightIds: [],
      regionName: null,
      countryName: "France",
    });

    expect(result!.cards.map((c) => c.id)).toEqual(["5"]);
  });
});
