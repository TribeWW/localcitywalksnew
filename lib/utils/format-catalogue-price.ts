const CATALOGUE_PRICE_LOCALE = "en-IE";

/**
 * Formats a catalogue headline amount for card/widget display.
 * Returns null when the amount or currency is not safe to render.
 */
export function formatCataloguePriceAmount(
  amount: number,
  currency: string,
): string | null {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (!normalizedCurrency || !Number.isFinite(amount) || amount < 0) {
    return null;
  }

  try {
    return new Intl.NumberFormat(CATALOGUE_PRICE_LOCALE, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return null;
  }
}
