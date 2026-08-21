/**
 * dismiss-cookie — unit tests for promo banner session-dismiss cookie helpers.
 */

import { describe, expect, it } from "vitest";
import {
  PROMO_DISMISS_COOKIE_NAME,
  buildPromoDismissDocumentCookie,
  encodePromoDismissCookieValue,
  isPromoDismissedForCampaign,
  parsePromoDismissCampaignId,
} from "./dismiss-cookie";

const CAMPAIGN_ID =
  "2026-08-01T00:00:00.000Z|2026-08-31T00:00:00.000Z|SUMMER20";

describe("encodePromoDismissCookieValue / parsePromoDismissCampaignId", () => {
  it("round-trips a campaign id that contains |", () => {
    const encoded = encodePromoDismissCookieValue(CAMPAIGN_ID);
    expect(encoded).not.toContain("|");
    expect(encoded).toBe(encodeURIComponent(CAMPAIGN_ID));
    expect(parsePromoDismissCampaignId(encoded)).toBe(CAMPAIGN_ID);
  });

  it("rejects missing, blank, and undecodable garbage", () => {
    expect(parsePromoDismissCampaignId(null)).toBeNull();
    expect(parsePromoDismissCampaignId(undefined)).toBeNull();
    expect(parsePromoDismissCampaignId("")).toBeNull();
    expect(parsePromoDismissCampaignId("   ")).toBeNull();
    expect(parsePromoDismissCampaignId("%E0%A4%A")).toBeNull();
  });
});

describe("buildPromoDismissDocumentCookie", () => {
  it("writes a session cookie with Path=/ and SameSite=Lax", () => {
    const cookie = buildPromoDismissDocumentCookie(CAMPAIGN_ID);
    expect(cookie.startsWith(`${PROMO_DISMISS_COOKIE_NAME}=`)).toBe(true);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toMatch(/Max-Age=/i);
    expect(cookie).not.toMatch(/Expires=/i);
    expect(cookie).toContain(encodeURIComponent(CAMPAIGN_ID));
  });
});

describe("isPromoDismissedForCampaign", () => {
  it("is true only when the cookie matches the active campaign id", () => {
    const encoded = encodePromoDismissCookieValue(CAMPAIGN_ID);
    expect(isPromoDismissedForCampaign(encoded, CAMPAIGN_ID)).toBe(true);
    expect(
      isPromoDismissedForCampaign(
        encoded,
        "2026-09-01T00:00:00.000Z|2026-09-30T00:00:00.000Z|FALL10",
      ),
    ).toBe(false);
    expect(isPromoDismissedForCampaign(null, CAMPAIGN_ID)).toBe(false);
    expect(isPromoDismissedForCampaign("%E0%A4%A", CAMPAIGN_ID)).toBe(false);
  });
});
