"use client";

/**
 * Step 2 of the custom tour request form — contact details and submit.
 */

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { Control } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CHECKOUT_CHECKBOX_CLASS,
  CHECKOUT_FIELD_CLASS,
} from "@/components/checkout/checkout-field-styles";
import { WIDGET_PRIMARY_BUTTON_CLASS } from "@/components/tours/booking-widget/widget-field-styles";
import type { TourRequestSchema } from "@/lib/validation/forms";

type TourRequestFormValues = z.infer<typeof TourRequestSchema>;

interface TourRequestContactStepProps {
  control: Control<TourRequestFormValues>;
  isSubmitting: boolean;
  consentError: boolean;
  onBack: () => void;
  onConsentChange: (checked: boolean) => void;
}

interface LabeledFieldProps {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}

function LabeledField({ id, label, required, children }: LabeledFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

export default function TourRequestContactStep({
  control,
  isSubmitting,
  consentError,
  onBack,
  onConsentChange,
}: TourRequestContactStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <LabeledField id="tour-request-full-name" label="Full name" required>
              <FormControl>
                <Input
                  id="tour-request-full-name"
                  placeholder="Jane Smith"
                  className={CHECKOUT_FIELD_CLASS}
                  {...field}
                />
              </FormControl>
            </LabeledField>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <LabeledField
              id="tour-request-email"
              label="Email address"
              required
            >
              <FormControl>
                <Input
                  id="tour-request-email"
                  type="email"
                  placeholder="jane@example.com"
                  className={CHECKOUT_FIELD_CLASS}
                  {...field}
                />
              </FormControl>
            </LabeledField>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <LabeledField id="tour-request-phone" label="Phone number">
              <FormControl>
                <Input
                  id="tour-request-phone"
                  type="tel"
                  placeholder="+1 234 567 890"
                  className={CHECKOUT_FIELD_CLASS}
                  {...field}
                />
              </FormControl>
            </LabeledField>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="consent"
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-row items-start gap-4 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    const value = checked === true;
                    field.onChange(value);
                    onConsentChange(value);
                  }}
                  className={CHECKOUT_CHECKBOX_CLASS}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal leading-relaxed text-nightsky">
                  I agree that LocalCityWalks may use my details to respond to
                  this request.
                </FormLabel>
                <FormMessage />
              </div>
            </div>
            {consentError ? (
              <p className="ml-8 text-xs text-destructive">
                Please agree before sending your request.
              </p>
            ) : null}
          </FormItem>
        )}
      />

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 border-none bg-transparent px-1 py-2 text-sm font-medium text-nightsky transition-colors hover:text-tangerine"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>
        <div className="flex-1">
          <Button
            type="submit"
            className={WIDGET_PRIMARY_BUTTON_CLASS}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
