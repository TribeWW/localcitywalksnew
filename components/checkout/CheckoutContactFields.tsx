"use client";

/**
 * Contact form fields for checkout summary — your details column (LOC-1147).
 *
 * Controlled presentational component; validation and submit wiring land in Phase 2+.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  /** When false, omits the optional comments textarea (default true). */
  showComments?: boolean;
}

/**
 * Renders first/last name, email, phone, and optional comments with labels.
 */
export function CheckoutContactFields({
  values,
  onFieldChange,
  showComments = true,
}: CheckoutContactFieldsProps) {
  const handleChange =
    (field: keyof CheckoutContactFieldsValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFieldChange(field, event.target.value);
    };

  return (
    <section>
      <CheckoutSectionHeading
        title="Your details"
        lead="We'll use this to send your booking confirmation."
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="checkout-first-name">
              First name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="checkout-first-name"
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              required
              value={values.firstName}
              onChange={handleChange("firstName")}
              className={CHECKOUT_FIELD_CLASS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout-last-name">
              Last name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="checkout-last-name"
              type="text"
              autoComplete="family-name"
              placeholder="Smith"
              required
              value={values.lastName}
              onChange={handleChange("lastName")}
              className={CHECKOUT_FIELD_CLASS}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-email">
            Email address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="checkout-email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            required
            value={values.email}
            onChange={handleChange("email")}
            className={CHECKOUT_FIELD_CLASS}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-phone">Phone number</Label>
          <Input
            id="checkout-phone"
            type="tel"
            autoComplete="tel"
            placeholder="Phone number (optional)"
            value={values.phone}
            onChange={handleChange("phone")}
            className={CHECKOUT_FIELD_CLASS}
          />
        </div>

        {showComments ? (
          <div className="space-y-2">
            <Label htmlFor="checkout-comments">
              Comments{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
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
