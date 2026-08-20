"use client";

/**
 * Checkout summary screen — contact, payment, and order recap (LOC-1148).
 *
 * Composes Task 1.1 primitives. When `handoffToken` is set (live `/checkout`),
 * Pay calls `initiateCheckoutPayment` with loading/disabled state and reserve
 * error toasts (LOC-1162). Mock preview omits the token and uses `onPayClick`.
 * When `promoCodeEnabled` is set, the order summary shows `PromoCodeInput`
 * and updates the payable total / Pay label from validated discounts (LOC-1232).
 */

import { useState } from "react";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";
import { initiateCheckoutPayment } from "@/lib/checkout/payment.actions";
import { buildInitiateCheckoutPaymentInput } from "@/lib/checkout/build-initiate-checkout-payment-input";
import { runCheckoutPayClick } from "@/lib/checkout/run-checkout-pay-click";
import { validatePromoCode } from "@/lib/checkout/promo-code.actions";
import { DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS } from "@/lib/bokun/resolve-main-contact-requirements";
import { formatCataloguePriceAmount } from "@/lib/bokun/format-catalogue-price";

import { CheckoutContactFields } from "./CheckoutContactFields";
import type { CheckoutContactFieldsValues } from "./CheckoutContactFields";
import { CheckoutPageLayout } from "./CheckoutPageLayout";
import { CheckoutPaymentCancelledBanner } from "./CheckoutPaymentCancelledBanner";
import { CheckoutPaymentSection } from "./CheckoutPaymentSection";
import { CheckoutPriceUpdatedBanner } from "./CheckoutPriceUpdatedBanner";
import type { CheckoutPriceUpdate } from "@/lib/checkout/checkout-price-update";
import type { CheckoutContactRequirements } from "@/types/bokun";
import type { CheckoutOrderFixture } from "./checkout-mock-fixture";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { OrderSummaryLineItem } from "./OrderSummaryLineItem";
import {
  PromoCodeInput,
  type AppliedPromoCode,
  type PromoCodeValidateResult,
} from "./PromoCodeInput";

const EMPTY_CONTACT: CheckoutContactFieldsValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  comments: "",
};

export interface CheckoutSummaryViewProps {
  order: CheckoutOrderFixture;
  /** When set, Pay is blocked until the customer accepts the updated total. */
  priceUpdate?: CheckoutPriceUpdate | null;
  /** Tour page href for price-update return link. */
  tourPageHref?: string;
  /** Signed handoff token from `/checkout?h=…`; enables live Pay wiring. */
  handoffToken?: string;
  /** Product-driven required flags for contact fields (from `loadCheckoutSummary`). */
  contactRequirements?: CheckoutContactRequirements;
  /** When true, show banner after Stripe Checkout cancel return (LOC-1163). */
  paymentCancelled?: boolean;
  /**
   * When true, shows the promo-code control in the order summary.
   * Driven by the Vercel `promo-code` feature flag on the checkout page.
   */
  promoCodeEnabled?: boolean;
  /** Pay CTA handler for mock preview when `handoffToken` is omitted. */
  onPayClick?: () => void;
}

/**
 * Renders the full checkout summary layout for a single tour.
 */
export function CheckoutSummaryView({
  order,
  priceUpdate = null,
  tourPageHref = "/explore",
  handoffToken,
  contactRequirements = DEFAULT_CHECKOUT_CONTACT_REQUIREMENTS,
  paymentCancelled = false,
  promoCodeEnabled = false,
  onPayClick,
}: CheckoutSummaryViewProps) {
  const [contact, setContact] =
    useState<CheckoutContactFieldsValues>(EMPTY_CONTACT);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [priceAcknowledged, setPriceAcknowledged] = useState(false);
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromoCode | null>(
    null,
  );

  const requiresPriceAcknowledgement = priceUpdate != null;
  const isPriceGateOpen = !requiresPriceAcknowledgement || priceAcknowledged;

  const payableAmount = appliedPromo?.discountedAmount ?? order.totalAmount;
  const formattedTotal = formatCataloguePriceAmount(
    payableAmount,
    order.currency,
  );
  const payLabel = formattedTotal ? `Pay ${formattedTotal}` : "Pay";

  const handleFieldChange = (
    field: keyof CheckoutContactFieldsValues,
    value: string,
  ) => {
    setContact((current) => ({ ...current, [field]: value }));
  };

  /**
   * Validates a promo code via the server action (handoff only; no contact needed).
   *
   * Maps server failures to deterministic UI reasons (invalid vs unavailable)
   * so timeouts / infra errors show retry copy instead of “invalid code”.
   *
   * @param code - Trimmed promo code from `PromoCodeInput`
   */
  async function handleValidatePromoCode(
    code: string,
  ): Promise<PromoCodeValidateResult> {
    if (!handoffToken) {
      return { valid: false, reason: "unavailable" };
    }

    const result = await validatePromoCode({
      handoffToken,
      promoCode: code,
    });

    if (!result.success) {
      if (
        result.error === "invalid_promo_code" ||
        result.error === "invalid_response"
      ) {
        return { valid: false, reason: "invalid" };
      }

      return { valid: false, reason: "unavailable" };
    }

    if (!result.data.valid) {
      return { valid: false, reason: "invalid" };
    }

    return {
      valid: true,
      code: code.trim().toUpperCase(),
      discountAmount: result.data.discountAmount,
      discountedAmount: result.data.discountedAmount,
    };
  }

  /**
   * Starts Bókun reserve + Stripe session creation after contact and terms gates.
   *
   * Redirects to hosted Stripe Checkout on success; surfaces reserve / infra
   * failures via toast (sold-out copy per LOC-1103).
   */
  async function handlePayClick() {
    if (!isPriceGateOpen || !termsAccepted || isPayLoading) {
      return;
    }

    if (handoffToken) {
      setIsPayLoading(true);
      let didRedirect = false;

      try {
        const input = buildInitiateCheckoutPaymentInput({
          handoffToken,
          contact,
          termsAccepted: true,
          clientQuote: {
            totalAmount: order.totalAmount,
            currency: order.currency,
          },
          ...(appliedPromo?.code ? { promoCode: appliedPromo.code } : {}),
        });
        const outcome = await runCheckoutPayClick(
          initiateCheckoutPayment,
          input,
        );

        if (outcome.type === "redirect") {
          didRedirect = true;
          window.location.assign(outcome.redirectUrl);
          return;
        }

        toast.error(outcome.error);
      } catch (error) {
        console.error("Checkout summary Pay error:", error);
        toast.error("Unable to complete payment. Please try again later.");
      } finally {
        if (!didRedirect) {
          setIsPayLoading(false);
        }
      }

      return;
    }

    onPayClick?.();
  }
  return (
    <CheckoutPageLayout
      leftColumn={
        <>
          {paymentCancelled ? <CheckoutPaymentCancelledBanner /> : null}
          {priceUpdate ? (
            <CheckoutPriceUpdatedBanner
              priceUpdate={priceUpdate}
              tourPageHref={tourPageHref}
              acknowledged={priceAcknowledged}
              onAcknowledgedChange={setPriceAcknowledged}
            />
          ) : null}
          <CheckoutContactFields
            values={contact}
            onFieldChange={handleFieldChange}
            contactRequirements={contactRequirements}
          />
          <Separator />
          <CheckoutPaymentSection
            payLabel={payLabel}
            termsAccepted={termsAccepted}
            onTermsAcceptedChange={setTermsAccepted}
            onPayClick={handlePayClick}
            payDisabled={!isPriceGateOpen}
            payLoading={isPayLoading}
          />
        </>
      }
      rightColumn={
        <OrderSummaryCard
          itemCount={1}
          totalAmount={payableAmount}
          currency={order.currency}
        >
          <OrderSummaryLineItem
            imageUrl={order.imageUrl}
            imageAlt={order.imageAlt}
            title={order.title}
            dateLabel={order.dateLabel}
            timeLabel={order.timeLabel}
            participantsLabel={order.participantsLabel}
            languageLabel={order.languageLabel}
            priceAmount={order.totalAmount}
            currency={order.currency}
          />
          {promoCodeEnabled ? (
            <PromoCodeInput
              currency={order.currency}
              onValidate={handleValidatePromoCode}
              onAppliedChange={setAppliedPromo}
            />
          ) : null}
        </OrderSummaryCard>
      }
    />
  );
}
