/**
 * region.helpers — unit tests for region Sanity schema helpers.
 */

import { describe, expect, it } from "vitest";
import { prepareRegionPreview } from "./region.helpers";

describe("prepareRegionPreview", () => {
  it("uses the region name as the list title", () => {
    expect(
      prepareRegionPreview({ name: "Provence", countryName: "France" }),
    ).toEqual({
      title: "Provence",
      subtitle: "France",
    });
  });

  it("omits subtitle when country is unset", () => {
    expect(prepareRegionPreview({ name: "Andalusia" })).toEqual({
      title: "Andalusia",
      subtitle: undefined,
    });
  });

  it("falls back to a default title when name is blank", () => {
    expect(prepareRegionPreview({ name: "   " })).toEqual({
      title: "Region",
      subtitle: undefined,
    });
    expect(prepareRegionPreview({})).toEqual({
      title: "Region",
      subtitle: undefined,
    });
  });
});
