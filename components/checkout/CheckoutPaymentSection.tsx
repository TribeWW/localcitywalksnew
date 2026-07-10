"use client";

/**
 * Payment column for checkout summary — Stripe placeholder, terms, Pay CTA (LOC-1147).
 *
 * Hosted Stripe Checkout redirect replaces the placeholder in Phase 3; this block
 * matches design brief §3.3 visual structure.
 */

import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import {
  CHECKOUT_CHECKBOX_CLASS,
  CHECKOUT_PRIMARY_BUTTON_CLASS,
} from "./checkout-field-styles";
import { CheckoutSectionHeading } from "./CheckoutSectionHeading";

const DEFAULT_TERMS_HREF = "/docs/LocalCityWalks_TermsAndConditions_EN.pdf";

export interface CheckoutPaymentSectionProps {
  /** CTA label, e.g. "Pay €496". */
  payLabel: string;
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
  onPayClick: () => void;
  payDisabled?: boolean;
  payLoading?: boolean;
  termsHref?: string;
}

/**
 * Renders payment section with Stripe placeholder, terms checkbox, Pay CTA, and trust line.
 */
export function CheckoutPaymentSection({
  payLabel,
  termsAccepted,
  onTermsAcceptedChange,
  onPayClick,
  payDisabled = false,
  payLoading = false,
  termsHref = DEFAULT_TERMS_HREF,
}: CheckoutPaymentSectionProps) {
  const isPayDisabled = payDisabled || !termsAccepted || payLoading;
  return (
    <section>
      <CheckoutSectionHeading
        title="Payment"
        lead="Secure checkout powered by Stripe."
      />

      <div className="mb-6 flex items-start gap-3 sm:mb-8">
        <Checkbox
          id="checkout-terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => onTermsAcceptedChange(checked === true)}
          className={CHECKOUT_CHECKBOX_CLASS}
          aria-required
        />
        <div className="text-sm font-normal leading-relaxed text-nightsky">
          <Label
            htmlFor="checkout-terms"
            className="inline font-normal text-inherit"
          >
            I accept the terms &amp; conditions.
          </Label>{" "}
          <a
            href={termsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-watermelon underline underline-offset-[3px] hover:text-tangerine"
          >
            Read terms
          </a>
        </div>{" "}
      </div>

      <Button
        type="button"
        size="lg"
        className={CHECKOUT_PRIMARY_BUTTON_CLASS}
        disabled={isPayDisabled}
        aria-busy={payLoading}
        onClick={onPayClick}
      >
        {payLabel}
      </Button>

      <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-nightsky"
          aria-hidden
        />
        <p>
          <span className="font-medium text-nightsky">Free cancellation</span>
          {" — until 24 hours before activity"}
        </p>
      </div>
    </section>
  );
}
