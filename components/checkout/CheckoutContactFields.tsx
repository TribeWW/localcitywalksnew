"use client";

/**
 * Contact form fields for checkout summary — your details column (LOC-1147).
 *
 * Required markers follow Bókun product `mainContactFields` via
 * `contactRequirements` from `loadCheckoutSummary`.
 */

import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS } from "@/lib/bokun/resolve-main-contact-requirements";
import { cn } from "@/lib/utils";
import type { CheckoutContactRequirements } from "@/types/bokun";

import { CHECKOUT_FIELD_CLASS } from "./checkout-field-styles";
import { CheckoutSectionHeading } from "./CheckoutSectionHeading";

/** Field values for checkout contact form. */
export interface CheckoutContactFieldsValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  comments: string;
}

export interface CheckoutContactFieldsProps {
  values: CheckoutContactFieldsValues;
  onFieldChange: (
    field: keyof CheckoutContactFieldsValues,
    value: string,
  ) => void;
  /** Product-driven required flags; defaults to name/email required, phone optional. */
  contactRequirements?: CheckoutContactRequirements;
  /** When false, omits the optional comments textarea (default true). */
  showComments?: boolean;
}

/** Renders a destructive asterisk when a contact field is required. */
function CheckoutFieldRequiredMarker({ required }: { required: boolean }) {
  if (!required) {
    return null;
  }

  return <span className="text-destructive">*</span>;
}

interface CheckoutContactTextFieldProps {
  id: string;
  label: string;
  required: boolean;
  type: "text" | "email" | "tel";
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Shared text input row for checkout contact fields.
 *
 * @param props - Label, required state, and controlled input wiring
 */
function CheckoutContactTextField({
  id,
  label,
  required,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
}: CheckoutContactTextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} <CheckoutFieldRequiredMarker required={required} />
      </Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={CHECKOUT_FIELD_CLASS}
      />
    </div>
  );
}

/**
 * Resolves the phone field placeholder from product requirements.
 *
 * @param phoneRequired - Whether Bókun marks phone as required for this product
 */
function resolvePhonePlaceholder(phoneRequired: boolean): string {
  return phoneRequired ? "+1 234 567 8900" : "+1 234 567 8900 (optional)";
}

/**
 * Renders first/last name, email, phone, and optional comments with labels.
 *
 * @param props - Controlled values, change handler, and product contact rules
 */
export function CheckoutContactFields({
  values,
  onFieldChange,
  contactRequirements = DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS,
  showComments = true,
}: CheckoutContactFieldsProps) {
  const handleChange =
    (field: keyof CheckoutContactFieldsValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFieldChange(field, event.target.value);
    };

  const nameFields: Array<{
    id: string;
    label: string;
    field: "firstName" | "lastName";
    autoComplete: string;
    placeholder: string;
    required: boolean;
  }> = [
    {
      id: "checkout-first-name",
      label: "First name",
      field: "firstName",
      autoComplete: "given-name",
      placeholder: "Jane",
      required: contactRequirements.firstName,
    },
    {
      id: "checkout-last-name",
      label: "Last name",
      field: "lastName",
      autoComplete: "family-name",
      placeholder: "Smith",
      required: contactRequirements.lastName,
    },
  ];

  return (
    <section>
      <CheckoutSectionHeading
        title="Your details"
        lead="We'll use this to send your booking confirmation."
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {nameFields.map((fieldConfig) => (
            <CheckoutContactTextField
              key={fieldConfig.id}
              id={fieldConfig.id}
              label={fieldConfig.label}
              required={fieldConfig.required}
              type="text"
              autoComplete={fieldConfig.autoComplete}
              placeholder={fieldConfig.placeholder}
              value={values[fieldConfig.field]}
              onChange={handleChange(fieldConfig.field)}
            />
          ))}
        </div>

        <CheckoutContactTextField
          id="checkout-email"
          label="Email address"
          required={contactRequirements.email}
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
          value={values.email}
          onChange={handleChange("email")}
        />

        <CheckoutContactTextField
          id="checkout-phone"
          label="Phone number"
          required={contactRequirements.phone}
          type="tel"
          autoComplete="tel"
          placeholder={resolvePhonePlaceholder(contactRequirements.phone)}
          value={values.phone}
          onChange={handleChange("phone")}
        />

        {showComments ? (
          <div className="space-y-2">
            <Label htmlFor="checkout-comments">
              Comments{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="checkout-comments"
              rows={3}
              placeholder="Any special requests or questions for your guide..."
              value={values.comments}
              onChange={handleChange("comments")}
              className={cn(CHECKOUT_FIELD_CLASS, "min-h-[88px] resize-none")}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
