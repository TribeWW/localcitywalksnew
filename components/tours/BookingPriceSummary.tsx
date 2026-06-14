"use client";

/**
 * Live total price display for the booking widget (LOC-1049).
 *
 * Shows loading skeleton, error banner, or formatted total via `formatCataloguePriceAmount`.
 * Tax-inclusive copy per LOC-1041. Price updates use `aria-live="polite"` for screen readers.
 */

import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import type { BookingWidgetQuote } from "@/types/bokun";

/** Props for `BookingPriceSummary`. */
interface BookingPriceSummaryProps {
  /** Server-computed quote; `null` before a valid slot + participants selection. */
  quote: BookingWidgetQuote | null;
  /** True while `getTourBookingQuote` is in flight. */
  loading: boolean;
  /** User-facing quote error; takes precedence over loading/empty states. */
  error: string | null;
  /** When true, renders per-line breakdown from `quote.breakdown` (P1 / LOC-1054). */
  showBreakdown?: boolean;
}

/**
 * Renders total price, tax-inclusive helper text, and optional breakdown lines.
 */
const BookingPriceSummary = ({
  quote,
  loading,
  error,
  showBreakdown = false,
}: BookingPriceSummaryProps) => {
  const formattedTotal =
    quote != null
      ? formatCataloguePriceAmount(quote.totalAmount, quote.currency)
      : null;

  return (
    <div
      className="rounded-lg border border-border bg-pearl-gray/40 px-4 py-3"
      aria-live="polite"
      aria-atomic="true"
    >
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
      ) : null}

      {!loading && !error && quote && formattedTotal ? (
        <div className="space-y-1">
          <p className="text-base font-semibold text-nightsky">
            Total:{" "}
            <span className="text-tangerine text-xl">{formattedTotal}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Includes all taxes and fees
          </p>

          {showBreakdown && quote.breakdown.length > 0 ? (
            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-nightsky">
              {quote.breakdown.map((line) => {
                const unit = formatCataloguePriceAmount(
                  line.unitAmount,
                  line.currency,
                );
                const lineTotal = formatCataloguePriceAmount(
                  line.lineTotal,
                  line.currency,
                );
                if (!unit || !lineTotal) return null;

                return (
                  <li
                    key={`${line.categoryId}-${line.count}`}
                    className="flex justify-between gap-4"
                  >
                    <span>
                      {line.count} × {line.categoryLabel} ({unit})
                    </span>
                    <span className="font-medium">{lineTotal}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && !quote ? (
        <p className="text-sm text-muted-foreground">
          Select participants, date, and time to see your total price.
        </p>
      ) : null}
    </div>
  );
};

export default BookingPriceSummary;
