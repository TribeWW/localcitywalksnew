import type {
  BokunPriceListDateRange,
  BokunPriceListPassenger,
  BokunPriceListRate,
  BokunPriceListResponse,
  BokunPriceListTieredPrice,
  ProductPriceHeadline,
} from "@/types/bokun";

const ADULT_TICKET_CATEGORY = "ADULT";

function isDateWithinRange(
  catalogueDate: string,
  from: string,
  to: string,
): boolean {
  return catalogueDate >= from && catalogueDate <= to;
}

export function pickActiveDateRange(
  pricesByDateRange: BokunPriceListDateRange[],
  catalogueDate: string,
): BokunPriceListDateRange | null {
  for (const range of pricesByDateRange) {
    if (isDateWithinRange(catalogueDate, range.from, range.to)) {
      return range;
    }
  }
  return null;
}

export function pickDefaultRate(
  rates: BokunPriceListRate[],
  defaultRateId: number | undefined,
  productId?: string,
): BokunPriceListRate | null {
  if (rates.length === 0) {
    return null;
  }

  if (defaultRateId == null) {
    return null;
  }

  const matched = rates.find((rate) => rate.rateId === defaultRateId);
  if (matched) {
    return matched;
  }

  console.warn(
    `[price-list] defaultRateId ${defaultRateId} missing in rates for product ${productId ?? "unknown"}; using rates[0]`,
  );
  return rates[0] ?? null;
}

export function pickAdultPassenger(
  passengers: BokunPriceListPassenger[],
): BokunPriceListPassenger | null {
  const adult = passengers.find(
    (passenger) => passenger.ticketCategory === ADULT_TICKET_CATEGORY,
  );
  if (adult) {
    return adult;
  }

  return (
    passengers.find(
      (passenger) => passenger.title?.toLowerCase() === "adult",
    ) ?? null
  );
}

export function pickTwoGuestTier(
  tieredPrices: BokunPriceListTieredPrice[],
): BokunPriceListTieredPrice | null {
  if (tieredPrices.length === 0) {
    return null;
  }

  const minTwo = tieredPrices.find((tier) => tier.minPassengersRequired === 2);
  if (minTwo) {
    return minTwo;
  }

  const maxTwo = tieredPrices.find((tier) => tier.maxPassengersRequired === 2);
  if (maxTwo) {
    return maxTwo;
  }

  const containingTwo = tieredPrices.filter(
    (tier) =>
      tier.minPassengersRequired <= 2 && tier.maxPassengersRequired >= 2,
  );
  if (containingTwo.length === 0) {
    return null;
  }

  containingTwo.sort((left, right) => {
    const leftSpan = left.maxPassengersRequired - left.minPassengersRequired;
    const rightSpan = right.maxPassengersRequired - right.minPassengersRequired;
    return leftSpan - rightSpan;
  });

  return containingTwo[0] ?? null;
}

/**
 * Derives the listing card headline from a `price-list` payload and activity `defaultRateId`.
 * Rules: active date range, default rate, Adult tier, 2-guest-oriented band, amount as-is.
 */
export function extractHeadlineFromPriceList(
  priceList: BokunPriceListResponse,
  defaultRateId: number | undefined,
  catalogueDate: string,
  productId?: string,
): ProductPriceHeadline | null {
  const ranges = priceList.pricesByDateRange;
  if (!ranges?.length) {
    return null;
  }

  const activeRange = pickActiveDateRange(ranges, catalogueDate);
  if (!activeRange?.rates?.length) {
    return null;
  }

  const rate = pickDefaultRate(activeRange.rates, defaultRateId, productId);
  if (!rate) {
    return null;
  }

  const adult = pickAdultPassenger(rate.passengers ?? []);
  if (!adult?.tieredPrices?.length) {
    return null;
  }

  const tier = pickTwoGuestTier(adult.tieredPrices);
  if (!tier || !Number.isFinite(tier.amount) || tier.amount < 0) {
    return null;
  }

  const currency = tier.currency || priceList.defaultCurrency;
  if (!currency) {
    return null;
  }

  return { amount: tier.amount, currency };
}
