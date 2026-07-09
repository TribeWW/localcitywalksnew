/**
 * Resolves checkout contact required/optional flags from Bókun product metadata.
 *
 * Products expose contact rules via `mainContactFields` (enum + required flag) and
 * `requiredCustomerFields` (checkout question ids). Checkout uses the merged result
 * to drive UI markers and server-side validation before `reserveBokunCheckout`.
 */

import type {
  BokunMainContactField,
  BokunProductDetail,
  CheckoutContactFieldKey,
  CheckoutContactRequirements,
} from "@/types/bokun";

/** Subset of activity detail used to derive checkout contact requirements. */
export type ResolveMainContactRequirementsInput = Pick<
  BokunProductDetail,
  "mainContactFields" | "requiredCustomerFields"
>;

/** Maps Bókun `mainContactFields[].field` enums to checkout contact keys. */
const BOKUN_MAIN_CONTACT_FIELD_TO_CHECKOUT_KEY: Readonly<
  Record<string, CheckoutContactFieldKey>
> = {
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  EMAIL: "email",
  EMAIL_ADDRESS: "email",
  PHONE_NUMBER: "phone",
};

/** Maps Bókun `requiredCustomerFields[]` question ids to checkout contact keys. */
const BOKUN_REQUIRED_CUSTOMER_FIELD_TO_CHECKOUT_KEY: Readonly<
  Record<string, CheckoutContactFieldKey>
> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  phoneNumber: "phone",
};

/**
 * Default required flags when a product omits explicit main-contact metadata.
 *
 * Name and email are always collected for confirmation delivery; phone follows
 * the product configuration when present.
 */
export const DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS: CheckoutContactRequirements =
  {
    firstName: true,
    lastName: true,
    email: true,
    phone: false,
  };

/**
 * Maps a Bókun `mainContactFields[].field` enum to a checkout contact key.
 *
 * @param field - Value from `mainContactFields[].field` on activity detail
 * @returns Checkout key, or `null` when the field is not a known contact question
 */
export function mapBokunMainContactFieldToCheckoutKey(
  field: string,
): CheckoutContactFieldKey | null {
  const normalized = field.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  return BOKUN_MAIN_CONTACT_FIELD_TO_CHECKOUT_KEY[normalized] ?? null;
}

/**
 * Maps a Bókun `requiredCustomerFields[]` entry to a checkout contact key.
 *
 * @param questionId - Checkout question id from activity detail (e.g. `phoneNumber`)
 * @returns Checkout key, or `null` when the id is not a known contact question
 */
export function mapBokunRequiredCustomerFieldToCheckoutKey(
  questionId: string,
): CheckoutContactFieldKey | null {
  const trimmed = questionId.trim();
  if (!trimmed) {
    return null;
  }

  return BOKUN_REQUIRED_CUSTOMER_FIELD_TO_CHECKOUT_KEY[trimmed] ?? null;
}

/**
 * Applies an explicit required flag from product metadata onto requirements.
 *
 * @param requirements - Mutable requirements object to update
 * @param field - Checkout contact field to set
 * @param required - Whether Bókun marks the field as required
 */
function applyExplicitRequirement(
  requirements: CheckoutContactRequirements,
  field: CheckoutContactFieldKey,
  required: boolean,
): void {
  requirements[field] = required;
}

/**
 * Marks a checkout contact field as required (logical OR merge).
 *
 * @param requirements - Mutable requirements object to update
 * @param field - Checkout contact field to mark required
 */
function markFieldRequired(
  requirements: CheckoutContactRequirements,
  field: CheckoutContactFieldKey,
): void {
  requirements[field] = true;
}

/**
 * Derives checkout contact requirements from Bókun activity detail metadata.
 *
 * Merge rules:
 * 1. Start from {@link DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS}.
 * 2. For each `mainContactFields` row, set the mapped field to `required`.
 * 3. For each `requiredCustomerFields` entry, force the mapped field to required.
 *
 * When a field appears in `mainContactFields` with `required: false`, that explicit
 * optional flag overrides the default for that field. `requiredCustomerFields`
 * still forces a field to required when listed.
 *
 * @param input - `mainContactFields` and/or `requiredCustomerFields` from product detail
 * @returns Per-field booleans for checkout UI and Pay-click validation
 */
export function resolveMainContactRequirements(
  input: ResolveMainContactRequirementsInput,
): CheckoutContactRequirements {
  const requirements: CheckoutContactRequirements = {
    ...DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS,
  };

  const configuredFields = new Set<CheckoutContactFieldKey>();

  for (const row of input.mainContactFields ?? []) {
    const field = mapBokunMainContactFieldToCheckoutKey(row.field);
    if (!field) {
      continue;
    }

    configuredFields.add(field);
    applyExplicitRequirement(requirements, field, row.required);
  }

  for (const questionId of input.requiredCustomerFields ?? []) {
    const field = mapBokunRequiredCustomerFieldToCheckoutKey(questionId);
    if (!field) {
      continue;
    }

    markFieldRequired(requirements, field);
  }

  return requirements;
}

/**
 * Convenience wrapper that accepts a full `BokunProductDetail` product row.
 *
 * @param product - Activity detail from `GET /activity.json/{id}`
 */
export function resolveMainContactRequirementsFromProduct(
  product: ResolveMainContactRequirementsInput,
): CheckoutContactRequirements {
  return resolveMainContactRequirements(product);
}
