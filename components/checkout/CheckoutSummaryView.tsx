"use client";

/**
 * Checkout summary screen — contact, payment, and order recap (LOC-1148).
 *
 * Composes Task 1.1 primitives. When `handoffToken` is set (live `/checkout`),
 * Pay calls `initiateCheckoutPayment` with loading/disabled state and reserve
 * error toasts (LOC-1162). Mock preview omits the token and uses `onPayClick`.
 */

import { useState } from "react";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";
import { initiateCheckoutPayment } from "@/lib/actions/checkout-payment.actions";
import { buildInitiateCheckoutPaymentInput } from "@/lib/checkout/build-initiate-checkout-payment-input";
import { runCheckoutPayClick } from "@/lib/checkout/run-checkout-pay-click";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";

import { CheckoutContactFields } from "./CheckoutContactFields";
import type { CheckoutContactFieldsValues } from "./CheckoutContactFields";
import { CheckoutPageLayout } from "./CheckoutPageLayout";
import { CheckoutPaymentCancelledBanner } from "./CheckoutPaymentCancelledBanner";
import { CheckoutPaymentSection } from "./CheckoutPaymentSection";
import { CheckoutPriceUpdatedBanner } from "./CheckoutPriceUpdatedBanner";
import type { CheckoutPriceUpdate } from "@/lib/checkout/checkout-price-update";
import type { CheckoutOrderFixture } from "./checkout-mock-fixture";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { OrderSummaryLineItem } from "./OrderSummaryLineItem";

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
  /** When true, show banner after Stripe Checkout cancel return (LOC-1163). */
  paymentCancelled?: boolean;
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
  paymentCancelled = false,
  onPayClick,
}: CheckoutSummaryViewProps) {
  const [contact, setContact] =
    useState<CheckoutContactFieldsValues>(EMPTY_CONTACT);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [priceAcknowledged, setPriceAcknowledged] = useState(false);
  const [isPayLoading, setIsPayLoading] = useState(false);

  const requiresPriceAcknowledgement = priceUpdate != null;
  const isPriceGateOpen =
    !requiresPriceAcknowledgement || priceAcknowledged;

  const formattedTotal = formatCataloguePriceAmount(
    order.totalAmount,
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

      try {
        const input = buildInitiateCheckoutPaymentInput({
          handoffToken,
          contact,
          termsAccepted: true,
          clientQuote: {
            totalAmount: order.totalAmount,
            currency: order.currency,
          },
        });
        const outcome = await runCheckoutPayClick(
          initiateCheckoutPayment,
          input,
        );

        if (outcome.type === "redirect") {
          window.location.assign(outcome.redirectUrl);
          return;
        }

        toast.error(outcome.error);
      } catch (error) {
        console.error("Checkout summary Pay error:", error);
        toast.error(
          "Unable to complete payment. Please try again later.",
        );
      } finally {
        setIsPayLoading(false);
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
          totalAmount={order.totalAmount}
          currency={order.currency}
        >
          <OrderSummaryLineItem
            imageUrl={order.imageUrl}
            imageAlt={order.imageAlt}
            title={order.title}
            dateLabel={order.dateLabel}
            timeLabel={order.timeLabel}
            participantsLabel={order.participantsLabel}
            priceAmount={order.totalAmount}
            currency={order.currency}
          />
        </OrderSummaryCard>
      }
    />
  );
}
