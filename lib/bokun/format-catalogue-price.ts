const CATALOGUE_PRICE_LOCALE = "en-IE";

/** Optional display controls for {@link formatCataloguePriceAmount}. */
export interface FormatCataloguePriceAmountOptions {
  /**
   * Number of fraction digits to show.
   * Defaults to `2` (e.g. `€124.00`). Use `0` for listing cards (e.g. `€124`).
   */
  fractionDigits?: number;
}

/**
 * Formats a catalogue amount for widget/checkout/card display.
 *
 * Defaults to two fraction digits for consistent money UX in booking and
 * checkout. Listing cards may pass `{ fractionDigits: 0 }`.
 * Returns null when the amount or currency is not safe to render.
 */
export function formatCataloguePriceAmount(
  amount: number,
  currency: string,
  options?: FormatCataloguePriceAmountOptions,
): string | null {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (!normalizedCurrency || !Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const fractionDigits = options?.fractionDigits ?? 2;
  if (
    !Number.isInteger(fractionDigits) ||
    fractionDigits < 0 ||
    fractionDigits > 20
  ) {
    return null;
  }

  try {
    return new Intl.NumberFormat(CATALOGUE_PRICE_LOCALE, {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return null;
  }
}
