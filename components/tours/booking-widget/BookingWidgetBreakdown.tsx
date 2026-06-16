"use client";

/**
 * Inline price breakdown and total for the booking widget (LOC-1063).
 *
 * Compact variant of `BookingPriceSummary` for the mockup layout: line items,
 * bold total, and tax-inclusive helper text. Uses `aria-live="polite"` for
 * screen-reader price updates.
 *
 * State precedence: error → loading → success (quote) → empty prompt.
 */

import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import type { BookingWidgetQuote } from "@/types/bokun";

/** Props for `BookingWidgetBreakdown`. */
interface BookingWidgetBreakdownProps {
  /** Server-computed quote; `null` before a valid slot + participants selection. */
  quote: BookingWidgetQuote | null;
  /** True while `getTourBookingQuote` is in flight. */
  loading: boolean;
  /** User-facing quote error; takes precedence over loading/empty states. */
  error: string | null;
  /**
   * When false, omit the empty-state prompt.
   * Step 2 recap passes `false` so structure stays minimal when quote is absent.
   */
  showEmptyPrompt?: boolean;
}

/**
 * Renders per-line breakdown, total, and tax copy for the widget mockup.
 *
 * Only breakdown lines with `count > 0` are shown. Zero line totals render as “Free”.
 *
 * @param props.showEmptyPrompt - When true (default), shows guidance before first quote
 */
export default function BookingWidgetBreakdown({
  quote,
  loading,
  error,
  showEmptyPrompt = true,
}: BookingWidgetBreakdownProps) {
  const formattedTotal =
    quote != null
      ? formatCataloguePriceAmount(quote.totalAmount, quote.currency)
      : null;

  return (
    <div className="space-y-2" aria-live="polite" aria-atomic="true">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : loading ? (
        <div className="space-y-2" aria-busy="true">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ) : quote && formattedTotal ? (
        <>
          {quote.breakdown
            .filter((line) => line.count > 0)
            .map((line) => {
              const lineTotal = formatCataloguePriceAmount(
                line.lineTotal,
                line.currency,
              );
              if (!lineTotal) return null;

              return (
                <div
                  key={`${line.categoryId}-${line.count}`}
                  className="flex justify-between text-sm text-foreground"
                >
                  <span>
                    {line.categoryLabel} × {line.count}
                  </span>
                  <span>
                    {line.lineTotal === 0 ? "Free" : lineTotal}
                  </span>
                </div>
              );
            })}
          <div className="my-1 h-px bg-border" />
          <div className="flex justify-between text-base font-bold text-nightsky">
            <span>Total</span>
            <span>{formattedTotal}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Price includes taxes and fees
          </p>
        </>
      ) : showEmptyPrompt ? (
        <p className="text-sm text-muted-foreground">
          Select participants, date, and time to see your total price.
        </p>
      ) : null}
    </div>
  );
}
