/**
 * Stateless HMAC-signed checkout handoff tokens (LOC-1152 / LOC-1101).
 *
 * Widget → summary carries slot selection + client quote snapshot in `/checkout?h=…`.
 * Contact fields are collected on the summary page — not embedded in the token.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

import {
  tourBookingClientQuoteSchema,
  tourBookingParticipantsSchema,
  tourBookingProductIdSchema,
  tourBookingStartTimeIdSchema,
  type TourBookingClientQuote,
  type TourBookingQuoteInput,
} from "@/lib/validation/tour-booking";

/** Token format version — bump when payload shape changes. */
export const CHECKOUT_HANDOFF_TOKEN_VERSION = 1;

/** Handoff TTL aligned with Bókun reserve hold (30 minutes). */
export const CHECKOUT_HANDOFF_TTL_SECONDS = 30 * 60;

const checkoutHandoffPayloadSchema = z.object({
  v: z.literal(CHECKOUT_HANDOFF_TOKEN_VERSION),
  exp: z.number().int().positive(),
  productId: tourBookingProductIdSchema,
  date: z.string(),
  startTimeId: tourBookingStartTimeIdSchema,
  participants: tourBookingParticipantsSchema,
  language: z.string().trim().min(2).max(16).optional(),
  clientQuote: tourBookingClientQuoteSchema,
  productTitle: z.string().trim().min(1).optional(),
});

/** Verified handoff payload embedded in the signed token. */
export type CheckoutHandoffPayload = z.infer<typeof checkoutHandoffPayloadSchema>;

/** Input for minting a handoff token after server quote validation. */
export interface SignCheckoutHandoffInput extends TourBookingQuoteInput {
  clientQuote: TourBookingClientQuote;
  productTitle?: string;
}

export type VerifyCheckoutHandoffError =
  | "missing_secret"
  | "malformed"
  | "invalid_signature"
  | "expired"
  | "invalid_payload";

export type VerifyCheckoutHandoffResult =
  | { success: true; payload: CheckoutHandoffPayload }
  | { success: false; error: VerifyCheckoutHandoffError };

function getHandoffSecret(): string | null {
  const secret = process.env.CHECKOUT_HANDOFF_SECRET?.trim();
  return secret ? secret : null;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function signaturesMatch(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

/**
 * Mints a signed handoff token for `/checkout?h={token}`.
 *
 * @throws Error when `CHECKOUT_HANDOFF_SECRET` is not configured
 */
export function signCheckoutHandoffToken(input: SignCheckoutHandoffInput): string {
  const secret = getHandoffSecret();
  if (!secret) {
    throw new Error("CHECKOUT_HANDOFF_SECRET is not configured");
  }

  const payload: CheckoutHandoffPayload = {
    v: CHECKOUT_HANDOFF_TOKEN_VERSION,
    exp: Math.floor(Date.now() / 1000) + CHECKOUT_HANDOFF_TTL_SECONDS,
    productId: input.productId,
    date: input.date,
    startTimeId: input.startTimeId,
    participants: input.participants,
    language: input.language,
    clientQuote: input.clientQuote,
    productTitle: input.productTitle,
  };

  const parsed = checkoutHandoffPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid handoff payload",
    );
  }

  const body = encodeBase64Url(JSON.stringify(parsed.data));
  const signature = signBody(body, secret);
  return `${body}.${signature}`;
}

/**
 * Verifies token structure, HMAC signature, expiry, and payload schema.
 */
export function verifyCheckoutHandoffToken(
  token: string,
): VerifyCheckoutHandoffResult {
  const secret = getHandoffSecret();
  if (!secret) {
    return { success: false, error: "missing_secret" };
  }

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return { success: false, error: "malformed" };
  }

  const body = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = signBody(body, secret);

  if (!signaturesMatch(expectedSignature, signature)) {
    return { success: false, error: "invalid_signature" };
  }

  const decoded = decodeBase64Url(body);
  if (!decoded) {
    return { success: false, error: "malformed" };
  }

  let json: unknown;
  try {
    json = JSON.parse(decoded);
  } catch {
    return { success: false, error: "malformed" };
  }

  const parsed = checkoutHandoffPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return { success: false, error: "invalid_payload" };
  }

  if (parsed.data.exp <= Math.floor(Date.now() / 1000)) {
    return { success: false, error: "expired" };
  }

  return { success: true, payload: parsed.data };
}
