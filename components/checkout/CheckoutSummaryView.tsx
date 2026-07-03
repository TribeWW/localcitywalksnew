"use client";

/**
 * Checkout summary screen — contact, payment, and order recap (LOC-1148).
 *
 * Composes Task 1.1 primitives. Contact + terms state is local for static mock;
 * Phase 2 passes live order data via `order` and wires Pay to server actions.
 */

import { useState } from "react";

import { Separator } from "@/components/ui/separator";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";

import { CheckoutContactFields } from "./CheckoutContactFields";
import type { CheckoutContactFieldsValues } from "./CheckoutContactFields";
import { CheckoutPageLayout } from "./CheckoutPageLayout";
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
  /** Pay CTA handler; no-op in static mock when omitted. */
  onPayClick?: () => void;
}

/**
 * Renders the full checkout summary layout for a single tour.
 */
export function CheckoutSummaryView({
  order,
  priceUpdate = null,
  tourPageHref = "/explore",
  onPayClick,
}: CheckoutSummaryViewProps) {
  const [contact, setContact] =
    useState<CheckoutContactFieldsValues>(EMPTY_CONTACT);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [priceAcknowledged, setPriceAcknowledged] = useState(false);

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

  return (
    <CheckoutPageLayout
      leftColumn={
        <>
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
            onPayClick={onPayClick ?? (() => {})}
            payDisabled={!isPriceGateOpen}
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
