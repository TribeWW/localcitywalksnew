"use client";

/**
 * “From €X per adult” headline for the booking widget (LOC-1063).
 *
 * Shown in both collapsed and expanded widget states when bootstrap
 * `fromPriceAmount` / `fromPriceCurrency` are available from the price list.
 */

import { cn } from "@/lib/utils";
import { formatCataloguePriceAmount } from "@/lib/bokun/format-catalogue-price";

/** Visual density for the from-price headline. */
export type BookingWidgetFromPriceSize = "default" | "compact";

/** Props for `BookingWidgetFromPrice`. */
interface BookingWidgetFromPriceProps {
  /** Lowest adult unit price from the product price list. */
  amount?: number;
  /** ISO currency code (e.g. `"EUR"`). */
  currency?: string;
  /**
   * `default` — sidebar card (32px price).
   * `compact` — mobile bottom bar (20px price).
   */
  size?: BookingWidgetFromPriceSize;
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
  size = "default",
}: BookingWidgetFromPriceProps) {
  const formatted =
    amount != null && currency
      ? formatCataloguePriceAmount(amount, currency)
      : null;

  if (!formatted) {
    return null;
  }

  const isCompact = size === "compact";

  return (
    <div className="mb-0">
      <p
        className={cn(
          "text-muted-foreground mb-0.5",
          isCompact ? "text-xs" : "text-sm mb-1",
        )}
      >
        From
      </p>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-bold text-nightsky leading-tight",
            isCompact ? "text-xl" : "text-[32px]",
          )}
        >
          {formatted}
        </span>
        <span
          className={cn(
            "text-muted-foreground",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          per adult
        </span>
      </div>
    </div>
  );
}
