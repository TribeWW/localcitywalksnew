/**
 * Product-driven contact validation for checkout Pay click.
 *
 * Base Zod parsing in `checkout-payment.ts` keeps phone optional at schema level.
 * After tour detail is loaded, this module enforces per-product required fields
 * from Bókun `mainContactFields` / `requiredCustomerFields`.
 */

import type { CheckoutPaymentContact } from "@/lib/validation/checkout-payment";
import type {
  CheckoutContactFieldKey,
  CheckoutContactRequirements,
} from "@/types/bokun";

/** Result of validating summary contact fields against product requirements. */
export type ValidateCheckoutContactForProductResult =
  | { success: true }
  | { success: false; error: string };

const MISSING_FIELD_MESSAGES: Readonly<
  Record<CheckoutContactFieldKey, string>
> = {
  firstName: "Please enter your first name",
  lastName: "Please enter your last name",
  email: "Please enter your email address",
  phone: "Please enter your phone number",
};

/** Ordered contact fields validated before Bókun reserve. */
const CHECKOUT_CONTACT_FIELD_ORDER: readonly CheckoutContactFieldKey[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
];

/**
 * Returns user-facing copy when a required checkout contact field is empty.
 *
 * @param field - Checkout contact field key
 */
export function resolveMissingCheckoutContactFieldMessage(
  field: CheckoutContactFieldKey,
): string {
  return MISSING_FIELD_MESSAGES[field];
}

/**
 * Reads the trimmed string value for a checkout contact field.
 *
 * @param contact - Parsed summary-page contact payload
 * @param field - Field to read
 */
function readCheckoutContactFieldValue(
  contact: CheckoutPaymentContact,
  field: CheckoutContactFieldKey,
): string {
  if (field === "phone") {
    return contact.phone?.trim() ?? "";
  }

  return contact[field].trim();
}

/**
 * Validates summary contact fields against product-specific requirements.
 *
 * Only fields marked required in `contactRequirements` are checked for a non-empty
 * trimmed value. Format validation (email shape, phone regex) remains in Zod.
 *
 * @param contact - Parsed contact from `parseInitiateCheckoutPaymentInput`
 * @param requirements - Merged rules from `resolveMainContactRequirements`
 */
export function validateCheckoutContactForProduct(
  contact: CheckoutPaymentContact,
  requirements: CheckoutContactRequirements,
): ValidateCheckoutContactForProductResult {
  for (const field of CHECKOUT_CONTACT_FIELD_ORDER) {
    if (!requirements[field]) {
      continue;
    }

    if (!readCheckoutContactFieldValue(contact, field)) {
      return {
        success: false,
        error: resolveMissingCheckoutContactFieldMessage(field),
      };
    }
  }

  return { success: true };
}
