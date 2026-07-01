import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import { cn } from "@/lib/utils";

import { CHECKOUT_CARD_CLASS, CHECKOUT_CARD_PADDING_CLASS } from "./checkout-field-styles";

/**
 * Sticky order summary card for checkout (LOC-1147).
 */

export interface OrderSummaryCardProps {
  /** Line items (typically `OrderSummaryLineItem` components). */
  children: ReactNode;
  /** Number of tours in the order; v1 is always 1. */
  itemCount: number;
  /** Server-verified total in major currency units. */
  totalAmount: number;
  /** ISO currency code, e.g. "EUR". */
  currency: string;
  /** Optional classes on the card root. */
  className?: string;
}

/**
 * Renders the bordered order summary with item list, total row, and tax copy.
 */
export function OrderSummaryCard({
  children,
  itemCount,
  totalAmount,
  currency,
  className,
}: OrderSummaryCardProps) {
  const formattedTotal = formatCataloguePriceAmount(totalAmount, currency);
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <div
      className={cn(
        CHECKOUT_CARD_CLASS,
        CHECKOUT_CARD_PADDING_CLASS,
        "flex flex-col gap-6",
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-[480px]:flex-row min-[480px]:items-baseline min-[480px]:justify-between min-[480px]:gap-4">
        <h2 className="text-xl font-semibold text-watermelon">Order summary</h2>
        <span className="text-sm text-muted-foreground">{itemLabel}</span>
      </div>

      <Separator />

      <div className="flex flex-col gap-5">{children}</div>

      <Separator />

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-lg font-bold text-nightsky">Total</span>
          <span className="text-lg font-bold text-nightsky">
            {formattedTotal ?? "—"}
          </span>
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          All taxes and fees included
        </p>
      </div>
    </div>
  );
}
