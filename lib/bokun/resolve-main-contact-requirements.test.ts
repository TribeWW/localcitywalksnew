/**
 * resolve-main-contact-requirements — product-driven checkout contact rules.
 */

import { describe, expect, it } from "vitest";
import {
  mapBokunMainContactFieldToCheckoutKey,
  mapBokunRequiredCustomerFieldToCheckoutKey,
  resolveMainContactRequirements,
} from "@/lib/bokun/resolve-main-contact-requirements";
import type { BokunMainContactField } from "@/types/bokun";

/** Mirrors `payloads/Examplepayloadproductbyid.json` main-contact config. */
const exampleProductMainContactFields: BokunMainContactField[] = [
  {
    field: "FIRST_NAME",
    required: true,
    requiredBeforeDeparture: false,
  },
  {
    field: "LAST_NAME",
    required: true,
    requiredBeforeDeparture: false,
  },
  {
    field: "PHONE_NUMBER",
    required: true,
    requiredBeforeDeparture: false,
  },
];

describe("mapBokunMainContactFieldToCheckoutKey", () => {
  it("maps standard Bókun main-contact field enums to checkout keys", () => {
    expect(mapBokunMainContactFieldToCheckoutKey("FIRST_NAME")).toBe(
      "firstName",
    );
    expect(mapBokunMainContactFieldToCheckoutKey("LAST_NAME")).toBe("lastName");
    expect(mapBokunMainContactFieldToCheckoutKey("EMAIL")).toBe("email");
    expect(mapBokunMainContactFieldToCheckoutKey("PHONE_NUMBER")).toBe("phone");
  });

  it("returns null for unknown field codes", () => {
    expect(mapBokunMainContactFieldToCheckoutKey("PASSPORT_NUMBER")).toBeNull();
  });
});

describe("mapBokunRequiredCustomerFieldToCheckoutKey", () => {
  it("maps Bókun questionId strings from requiredCustomerFields", () => {
    expect(mapBokunRequiredCustomerFieldToCheckoutKey("firstName")).toBe(
      "firstName",
    );
    expect(mapBokunRequiredCustomerFieldToCheckoutKey("lastName")).toBe(
      "lastName",
    );
    expect(mapBokunRequiredCustomerFieldToCheckoutKey("email")).toBe("email");
    expect(mapBokunRequiredCustomerFieldToCheckoutKey("phoneNumber")).toBe(
      "phone",
    );
  });

  it("returns null for unknown question ids", () => {
    expect(
      mapBokunRequiredCustomerFieldToCheckoutKey("nationality"),
    ).toBeNull();
  });
});

describe("resolveMainContactRequirements", () => {
  it("uses safe defaults when product omits main-contact metadata", () => {
    expect(resolveMainContactRequirements({})).toEqual({
      firstName: true,
      lastName: true,
      email: true,
      phone: false,
    });
  });

  it("marks phone required for the example Biarritz product payload", () => {
    expect(
      resolveMainContactRequirements({
        mainContactFields: exampleProductMainContactFields,
        requiredCustomerFields: ["firstName", "lastName", "phoneNumber"],
      }),
    ).toEqual({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    });
  });

  it("marks a field required when listed in requiredCustomerFields", () => {
    expect(
      resolveMainContactRequirements({
        requiredCustomerFields: ["phoneNumber"],
      }),
    ).toEqual({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    });
  });

  it("marks a field required when mainContactFields.required is true", () => {
    expect(
      resolveMainContactRequirements({
        mainContactFields: [
          {
            field: "PHONE_NUMBER",
            required: true,
            requiredBeforeDeparture: false,
          },
        ],
      }),
    ).toEqual({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    });
  });

  it("clears a default-required field when mainContactFields marks it optional", () => {
    expect(
      resolveMainContactRequirements({
        mainContactFields: [
          {
            field: "FIRST_NAME",
            required: false,
            requiredBeforeDeparture: false,
          },
          {
            field: "EMAIL",
            required: false,
            requiredBeforeDeparture: false,
          },
        ],
      }),
    ).toEqual({
      firstName: false,
      lastName: true,
      email: false,
      phone: false,
    });
  });

  it("keeps phone optional when product explicitly marks PHONE_NUMBER optional", () => {
    expect(
      resolveMainContactRequirements({
        mainContactFields: [
          {
            field: "PHONE_NUMBER",
            required: false,
            requiredBeforeDeparture: false,
          },
        ],
      }),
    ).toEqual({
      firstName: true,
      lastName: true,
      email: true,
      phone: false,
    });
  });

  it("ignores unknown entries in both product metadata arrays", () => {
    expect(
      resolveMainContactRequirements({
        mainContactFields: [
          {
            field: "UNKNOWN_FIELD",
            required: true,
            requiredBeforeDeparture: false,
          },
        ],
        requiredCustomerFields: ["loyaltyId"],
      }),
    ).toEqual({
      firstName: true,
      lastName: true,
      email: true,
      phone: false,
    });
  });
});
