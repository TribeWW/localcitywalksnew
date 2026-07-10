"use client";

/**
 * “From €X per adult” headline for the booking widget (LOC-1063).
 *
 * Shown in both collapsed and expanded widget states when bootstrap
 * `fromPriceAmount` / `fromPriceCurrency` are available from the price list.
 */

import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";

/** Props for `BookingWidgetFromPrice`. */
interface BookingWidgetFromPriceProps {
  /** Lowest adult unit price from the product price list. */
  amount?: number;
  /** ISO currency code (e.g. `"EUR"`). */
  currency?: string;
}

/**
 * Renders the from-price headline, or `null` when amount/currency are missing.
 *
 * @param props.amount - Numeric price; both amount and currency are required to render
 * @param props.currency - Currency code paired with `amount`
 */
export default function BookingWidgetFromPrice({
  amount,
  currency,
}: BookingWidgetFromPriceProps) {
  const formatted =
    amount != null && currency
      ? formatCataloguePriceAmount(amount, currency)
      : null;

  if (!formatted) {
    return null;
  }

  return (
    <div className="mb-0">
      <p className="text-sm text-muted-foreground mb-1">From</p>
      <div className="flex items-baseline gap-1">
        <span className="text-[32px] font-bold text-nightsky">{formatted}</span>
        <span className="text-sm text-muted-foreground">per adult</span>
      </div>
    </div>
  );
}
