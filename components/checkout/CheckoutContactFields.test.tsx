/**
 * CheckoutContactFields — product-driven required markers.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutContactFields } from "@/components/checkout/CheckoutContactFields";
import { DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS } from "@/lib/bokun/resolve-main-contact-requirements";
import type { CheckoutContactRequirements } from "@/types/bokun";

const baseValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  comments: "",
};

function renderContactFields(
  contactRequirements: CheckoutContactRequirements = DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS,
) {
  const onFieldChange = vi.fn();

  render(
    <CheckoutContactFields
      values={baseValues}
      onFieldChange={onFieldChange}
      contactRequirements={contactRequirements}
    />,
  );

  return { onFieldChange };
}

describe("CheckoutContactFields", () => {
  it("marks phone optional by default", () => {
    renderContactFields();

    const phoneInput = screen.getByLabelText(/^phone number$/i);
    expect(phoneInput).not.toBeRequired();
    expect(phoneInput).toHaveAttribute(
      "placeholder",
      "Phone number (optional)",
    );
    expect(screen.queryByText(/^phone number \*$/i)).not.toBeInTheDocument();
  });

  it("marks phone required when product contact rules require it", () => {
    renderContactFields({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    });

    const phoneInput = screen.getByLabelText(/phone number/i);
    expect(phoneInput).toBeRequired();
    expect(phoneInput).toHaveAttribute("placeholder", "Phone number");
  });

  it("omits required markers for fields the product marks optional", () => {
    renderContactFields({
      firstName: false,
      lastName: true,
      email: false,
      phone: false,
    });

    expect(screen.getByLabelText(/^first name$/i)).not.toBeRequired();
    expect(screen.getByLabelText(/^last name \*$/i)).toBeRequired();
    expect(screen.getByLabelText(/^email address$/i)).not.toBeRequired();
  });

  it("forwards field changes to the parent handler", () => {
    const { onFieldChange } = renderContactFields({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    });

    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+34600000000" },
    });

    expect(onFieldChange).toHaveBeenCalledWith("phone", "+34600000000");
  });
});
