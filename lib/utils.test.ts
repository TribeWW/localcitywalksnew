import { describe, expect, it } from "vitest";
import { slugifyForUrl, stripAccents } from "@/lib/utils";

describe("stripAccents", () => {
  it("strips combining accents that NFD decomposes", () => {
    expect(stripAccents("Córdoba")).toBe("Cordoba");
    expect(stripAccents("Zürich")).toBe("Zurich");
    expect(stripAccents("Montréal")).toBe("Montreal");
    expect(stripAccents("A Coruña")).toBe("A Coruna");
  });

  it("folds letters that stay whole under NFD", () => {
    expect(stripAccents("Tromsø")).toBe("Tromso");
    expect(stripAccents("Wrocław")).toBe("Wroclaw");
    expect(stripAccents("Ærø")).toBe("Aero");
    expect(stripAccents("Straße")).toBe("Strasse");
    expect(stripAccents("Þingvellir")).toBe("Thingvellir");
  });
});

describe("slugifyForUrl", () => {
  it("keeps accented Latin city names as plain letter slugs", () => {
    expect(slugifyForUrl("Córdoba")).toBe("cordoba");
    expect(slugifyForUrl("A Coruña")).toBe("a-coruna");
    expect(slugifyForUrl("Donostia/San Sebastián")).toBe(
      "donostia-san-sebastian",
    );
  });

  it("folds ø, ł, and siblings instead of dropping them or inserting dashes", () => {
    expect(slugifyForUrl("Tromsø")).toBe("tromso");
    expect(slugifyForUrl("Wrocław")).toBe("wroclaw");
    expect(slugifyForUrl("Ærø")).toBe("aero");
    expect(slugifyForUrl("Reykjavík")).toBe("reykjavik");
    expect(slugifyForUrl("Gdańsk")).toBe("gdansk");
  });

  it("does not reproduce the pre-fix broken slugs", () => {
    expect(slugifyForUrl("Tromsø")).not.toBe("troms");
    expect(slugifyForUrl("Wrocław")).not.toBe("wroc-aw");
  });
});
