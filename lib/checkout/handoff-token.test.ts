/**
 * Checkout handoff token — sign/verify invariants (LOC-1152 / LOC-1158).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHECKOUT_HANDOFF_TTL_SECONDS,
  signCheckoutHandoffToken,
  verifyCheckoutHandoffToken,
} from "@/lib/checkout/handoff-token";
import type { SignCheckoutHandoffInput } from "@/lib/checkout/handoff-token";

const HANDOFF_SECRET = "test-handoff-secret-with-32-characters-min";

const handoffInput: SignCheckoutHandoffInput = {
  productId: "1079932",
  date: "2026-07-15",
  startTimeId: 4252139,
  participants: { adults: 2, youth: 0, children: 1, infants: 0 },
  language: "en",
  clientQuote: { totalAmount: 496, currency: "EUR" },
  productTitle: "Hello Palma de Mallorca",
};

describe("signCheckoutHandoffToken / verifyCheckoutHandoffToken", () => {
  beforeEach(() => {
    process.env.CHECKOUT_HANDOFF_SECRET = HANDOFF_SECRET;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.CHECKOUT_HANDOFF_SECRET;
  });

  it("round-trips a valid token with quote input and clientQuote", () => {
    const token = signCheckoutHandoffToken(handoffInput);
    const result = verifyCheckoutHandoffToken(token);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.payload).toMatchObject({
      v: 1,
      productId: handoffInput.productId,
      date: handoffInput.date,
      startTimeId: handoffInput.startTimeId,
      participants: handoffInput.participants,
      language: handoffInput.language,
      clientQuote: handoffInput.clientQuote,
      productTitle: handoffInput.productTitle,
    });
    expect(result.payload.exp).toBe(
      Math.floor(Date.now() / 1000) + CHECKOUT_HANDOFF_TTL_SECONDS,
    );
  });

  it("rejects expired tokens", () => {
    const token = signCheckoutHandoffToken(handoffInput);

    vi.setSystemTime(
      new Date(Date.now() + CHECKOUT_HANDOFF_TTL_SECONDS * 1000 + 1),
    );

    const result = verifyCheckoutHandoffToken(token);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error).toBe("expired");
    expect(result.recoveryPayload).toMatchObject({
      productId: handoffInput.productId,
      productTitle: handoffInput.productTitle,
    });
  });

  it("rejects tampered signatures", () => {
    const token = signCheckoutHandoffToken(handoffInput);
    const tampered = `${token.slice(0, -1)}x`;

    expect(verifyCheckoutHandoffToken(tampered)).toEqual({
      success: false,
      error: "invalid_signature",
    });
  });

  it("rejects tampered payload bodies", () => {
    const token = signCheckoutHandoffToken(handoffInput);
    const [body, signature] = token.split(".");
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    parsed.clientQuote = { totalAmount: 1, currency: "EUR" };
    const tamperedBody = Buffer.from(JSON.stringify(parsed), "utf8").toString(
      "base64url",
    );
    const tamperedToken = `${tamperedBody}.${signature}`;

    expect(verifyCheckoutHandoffToken(tamperedToken)).toEqual({
      success: false,
      error: "invalid_signature",
    });
  });

  it("rejects malformed tokens", () => {
    expect(verifyCheckoutHandoffToken("not-a-token")).toEqual({
      success: false,
      error: "malformed",
    });
  });

  it("returns missing_secret when CHECKOUT_HANDOFF_SECRET is unset", () => {
    delete process.env.CHECKOUT_HANDOFF_SECRET;

    expect(() => signCheckoutHandoffToken(handoffInput)).toThrow(
      "CHECKOUT_HANDOFF_SECRET is not configured",
    );
    expect(verifyCheckoutHandoffToken("a.b")).toEqual({
      success: false,
      error: "missing_secret",
    });
  });
});
