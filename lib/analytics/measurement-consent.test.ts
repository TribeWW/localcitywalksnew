import { describe, expect, it } from "vitest";
import { hasMeasurementConsent } from "./measurement-consent";

describe("hasMeasurementConsent", () => {
  it("reads the Measurement purpose when iubenda reports per-purpose consent", () => {
    expect(
      hasMeasurementConsent({ consent: true, purposes: { "4": true } }),
    ).toBe(true);
    expect(
      hasMeasurementConsent({
        consent: true,
        purposes: { "1": true, "4": false },
      }),
    ).toBe(false);
    expect(hasMeasurementConsent({ purposes: { "1": true } })).toBe(false);
  });

  it("falls back to the global consent flag without purposes", () => {
    expect(hasMeasurementConsent({ consent: true })).toBe(true);
    expect(hasMeasurementConsent({ consent: false })).toBe(false);
    expect(hasMeasurementConsent({})).toBe(false);
  });

  it("grants when iubenda reports that consent is not needed", () => {
    expect(hasMeasurementConsent(undefined)).toBe(true);
  });

  it("rejects an unknown preference shape", () => {
    expect(hasMeasurementConsent("yes")).toBe(false);
  });
});
