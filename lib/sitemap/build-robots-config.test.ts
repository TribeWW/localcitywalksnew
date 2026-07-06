/**
 * sitemap/build-robots-config — unit tests for robots.txt policy.
 */

import { describe, expect, it } from "vitest";
import {
  ROBOTS_DISALLOW_PATHS,
  buildRobotsConfig,
} from "@/lib/sitemap/build-robots-config";

describe("buildRobotsConfig", () => {
  it("points sitemap at the canonical www origin", () => {
    expect(buildRobotsConfig().sitemap).toBe(
      "https://www.localcitywalks.com/sitemap.xml",
    );
  });

  it("disallows studio, checkout, preview, and api paths", () => {
    const { rules } = buildRobotsConfig();
    const disallow = Array.isArray(rules) ? rules[0].disallow : rules.disallow;
    const paths = Array.isArray(disallow) ? disallow : [disallow];

    expect(paths).toEqual(expect.arrayContaining([...ROBOTS_DISALLOW_PATHS]));
    expect(paths).toContain("/studio/");
    expect(paths).toContain("/checkout");
    expect(paths).toContain("/preview/");
    expect(paths).toContain("/api/");
  });

  it("allows the public site root", () => {
    const { rules } = buildRobotsConfig();
    const allow = Array.isArray(rules) ? rules[0].allow : rules.allow;
    expect(allow).toBe("/");
  });
});
