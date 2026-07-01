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
  /** Pay CTA handler; no-op in static mock when omitted. */
  onPayClick?: () => void;
}

/**
 * Renders the full checkout summary layout for a single tour.
 */
export function CheckoutSummaryView({
  order,
  onPayClick,
}: CheckoutSummaryViewProps) {
  const [contact, setContact] =
    useState<CheckoutContactFieldsValues>(EMPTY_CONTACT);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
