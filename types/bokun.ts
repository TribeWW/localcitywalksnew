/**
 * Bokun API TypeScript Interfaces
 * Based on actual API response structure from /activity.json/search endpoint
 */

/**
 * Minimal response structure from Bokun search API
 * Only includes fields we actually use
 */
export interface BokunSearchResponse {
  items: BokunProduct[];
  totalHits?: number;
}

/**
 * Full googlePlace structure from Bokun (used for city/country sync)
 */
export interface BokunGooglePlace {
  country: string;
  countryCode: string; // ISO2
  city: string;
  cityCode: string; // Unique identifier
}

/**
 * Minimal product structure for city cards and search items
 * Matches Bokun search response (ExamplePayloadSearch.json). No slug in search; use id for URL.
 */
export interface BokunProduct {
  id: string;
  title: string;
  keyPhoto: BokunPhoto;
  googlePlace?: BokunGooglePlace;
  /** HTML description (search returns this) */
  summary?: string;
  /** Short plain-text blurb (search returns this) */
  excerpt?: string;
  /** Search payload price (not the listing headline; use `price-list` enrichment). */
  price?: number;
  /** Search payload review fields (non-authoritative for card ratings). */
  reviewRating?: number;
  reviewCount?: number;
}

/**
 * Minimal photo structure for keyPhoto
 * Only includes fields we actually use
 */
export interface BokunPhoto {
  derived: Array<{
    name: string; // "thumbnail", "preview", "large"
    url: string;
  }>;
}

/**
 * Simplified data structure for CityCard component and tour page links
 * URL = /tours/{citySlug}/{slug}. Slug is generated: slugify(title) + "-" + id (e.g. "hello-toledo-private-walk-1077682").
 */
export interface CityCardData {
  id: string;
  title: string;
  image: string;
  countryCode?: string;
  country?: string;
  /** Slugified googlePlace.city for /tours/{city}/{slug} (e.g. "toledo", "aix-en-provence") */
  citySlug?: string;
  /** Generated slug for URL segment: slugify(title) + "-" + id (e.g. "hello-toledo-private-walk-1077682") */
  slug?: string;
  /** Tier-aware per-person headline from `price-list` (amount as returned by Bókun). */
  displayPricePerPerson?: number;
  /** ISO currency for `displayPricePerPerson`. */
  displayPriceCurrency?: string;
  /** Listing rating label (e.g. `4.7`) when `showRating` is true. */
  ratingLabel?: string;
  /** Whether the listing card should render a rating row. */
  showRating?: boolean;
  /** Default rate from activity detail; avoids duplicate detail fetches during price enrichment. */
  defaultRateId?: number;
}

/**
 * Server action response for `getAllProducts`.
 * Success always includes `data`; failure always includes `error`.
 */
export type GetAllProductsResult =
  | { success: true; data: CityCardData[] }
  | { success: false; error: string };

/**
 * Server action response for paginated product fetch (`getProductsPage`, `getExploreCatalogPage`).
 * `completeCountryList` is present on explore catalog success responses only.
 */
export type GetProductsPageResult =
  | {
      success: true;
      data: CityCardData[];
      totalHits: number;
      completeCountryList?: Array<{
        countryCode: string;
        country: string;
      }>;
    }
  | { success: false; error: string };

/** Money amount from Bókun REST payloads (`amount` object on prices). */
export interface BokunMoneyAmount {
  amount: number;
  currency: string;
}

/** Pricing category row from activity detail (`pricingCategories[]`). */
export interface BokunPricingCategory {
  id: number;
  title?: string;
  ticketCategory?: string;
  minAge?: number | null;
  maxAge?: number | null;
}

/** Scheduled start time from activity detail (`startTimes[]`). */
export interface BokunStartTime {
  id: number;
  hour: number;
  minute: number;
  /** Duration in minutes */
  duration?: number;
}

/** Rate row from activity detail (`rates[]`). */
export interface BokunActivityRate {
  id: number;
  title?: string;
  tieredPricingEnabled?: boolean;
}

/**
 * Product detail from GET /activity.json/{id} (single-product endpoint).
 * Used for the tour page; shape aligned with search item + full description/photos.
 *
 * Bokun typically returns long-form HTML as `summary`; some payloads may expose `description` instead.
 */
export interface BokunProductDetail {
  id: string;
  /** Product title from Bokun */
  title: string;
  /** Long-form HTML body (Bokun REST often uses `summary` for this) */
  description?: string | null;
  summary?: string;
  /** Short plain-text intro / teaser */
  excerpt?: string;
  keyPhoto: BokunPhoto;
  photos?: BokunPhoto[];
  googlePlace?: BokunGooglePlace;
  /** Default rate for tiered pricing (activity detail payload) */
  defaultRateId?: number;
  /** Human-readable duration (e.g. "2 hours") */
  durationText?: string;
  /** IANA timezone (e.g. "Europe/Paris") */
  timeZone?: string;
  /** Product-level language codes when slot `guidedLanguages` is empty */
  languages?: string[];
  pricingCategories?: BokunPricingCategory[];
  startTimes?: BokunStartTime[];
  rates?: BokunActivityRate[];
}

/** Tier band for a pricing category on an availability slot. */
export interface BokunPricePerCategoryUnit {
  /** Pricing category id (e.g. Adult 1045649) */
  id: number;
  amount: BokunMoneyAmount;
  minParticipantsRequired: number;
  maxParticipantsRequired: number;
}

/** Per-rate prices on an availability slot (`pricesByRate[]`). */
export interface BokunAvailabilityPriceByRate {
  /** Matches `defaultRateId` or a row in product `rates[]` */
  activityRateId: number;
  pricePerCategoryUnit: BokunPricePerCategoryUnit[];
}

/**
 * Single availability slot from `GET /activity.json/{id}/availabilities`.
 * Shape aligned with `payloads/ExamplePayloadAvailabilities.json`.
 */
export interface BokunAvailability {
  /** Composite id, e.g. "4252139_20260612" */
  id: string;
  activityId: number;
  /** Localized time label, e.g. "17:00" */
  startTime?: string;
  startTimeId: number;
  /** Slot date as epoch milliseconds */
  date: number;
  localizedDate?: string;
  availabilityCount?: number;
  minParticipants?: number;
  minParticipantsToBookNow?: number;
  defaultRateId?: number;
  pricesByRate: BokunAvailabilityPriceByRate[];
  /** Slot-specific guided languages; empty → fall back to product `languages` */
  guidedLanguages: string[];
  soldOut: boolean;
  unavailable?: boolean;
  pickupSoldOut?: boolean;
}

/** Query params for availabilities fetch (`start`/`end` as YYYY-MM-DD). */
export interface BokunAvailabilitiesParams {
  /** Inclusive range start (YYYY-MM-DD) */
  start: string;
  /** Inclusive range end (YYYY-MM-DD) */
  end: string;
  /** Bókun language code; default `EN` in fetch layer */
  lang?: string;
  /** ISO currency; default `EUR` per LOC-1041 */
  currency?: string;
  /** When false, sold-out slots may be omitted from the response */
  includeSoldOut?: boolean;
}

/**
 * Widget participant counters (mapped to Bókun pricing category ids server-side).
 *
 * | Widget field | Typical ages | Bókun category (1079932) |
 * |--------------|--------------|--------------------------|
 * | `adults`     | 18+          | Adult (1045649)          |
 * | `youth`      | 13–17        | Youth (1045650)          |
 * | `children`   | 3–12         | Child (1045651)          |
 * | `infants`    | 0–2          | Infant (1045652)         |
 *
 * Category ids are product-specific; resolve from `pricingCategories` when implementing quote logic.
 */
export interface BookingWidgetParticipants {
  adults: number;
  youth: number;
  children: number;
  infants: number;
}

/** One priced line in the booking widget quote breakdown. */
export interface BookingWidgetQuoteLineItem {
  /** Bókun `pricingCategories[].id` */
  categoryId: number;
  /** Display label (e.g. "Adult", "Youth") */
  categoryLabel: string;
  count: number;
  /** Unit price for the band matching this category's count */
  unitAmount: number;
  /** `count × unitAmount` */
  lineTotal: number;
  currency: string;
}

/**
 * Server-computed quote for the booking widget.
 * Produced by `calculate-booking-quote` from availability + participant inputs.
 */
export interface BookingWidgetQuote {
  totalAmount: number;
  currency: string;
  breakdown: BookingWidgetQuoteLineItem[];
  source: "bokun-availability";
}

/** Server-passed bootstrap props for `BookingWidget` (tour page). */
export interface BookingWidgetBootstrap {
  /** Bókun activity id (numeric string). */
  productId: string;
  /** Product title for submit email / hidden fields. */
  productTitle: string;
  /** Locked city name for the request form. */
  cityName: string;
  /** Scheduled times from product detail; intersected with availabilities for the date picker. */
  startTimes: BokunStartTime[];
  /** Product-level language codes; used when slot `guidedLanguages` is empty. */
  languages: string[];
  /** Optional pricing category rows for quote label resolution. */
  pricingCategories?: BokunPricingCategory[];
  /** Read-only duration copy (e.g. “2 hours”); replaces `DurationSelector`. */
  durationText?: string;
  /** Default rate for tiered pricing; used server-side in quote pipeline. */
  defaultRateId?: number;
  /** Listing headline amount for “From €X per adult” (price-list enrichment). */
  fromPriceAmount?: number;
  /** Currency for `fromPriceAmount`. */
  fromPriceCurrency?: string;
}

/** Tier band from Bókun `price-list` (subset used for card headline extraction). */
export interface BokunPriceListTieredPrice {
  currency: string;
  amount: number;
  minPassengersRequired: number;
  maxPassengersRequired: number;
}

/** Passenger row from Bókun `price-list`. */
export interface BokunPriceListPassenger {
  title?: string;
  ticketCategory?: string;
  tieredPrices: BokunPriceListTieredPrice[];
}

/** Rate row from Bókun `price-list`. */
export interface BokunPriceListRate {
  rateId: number;
  title?: string;
  passengers: BokunPriceListPassenger[];
}

/** Date-range slice from Bókun `price-list`. */
export interface BokunPriceListDateRange {
  from: string;
  to: string;
  rates: BokunPriceListRate[];
}

/** Response from `GET /activity.json/{id}/price-list` (fields used for listing headline). */
export interface BokunPriceListResponse {
  defaultCurrency?: string;
  pricesByDateRange?: BokunPriceListDateRange[];
}

/** Per-person headline derived from `price-list` (amount as returned by Bókun; no division). */
export interface ProductPriceHeadline {
  amount: number;
  currency: string;
}

/**
 * Server action response for `getTourDetailById`.
 * Success always includes `data`; failure always includes `error`.
 */
export type GetTourDetailResult =
  | { success: true; data: BokunProductDetail }
  | { success: false; error: string };

/** Server action response for `getTourAvailabilities`. */
export type GetTourAvailabilitiesResult =
  | { success: true; data: BokunAvailability[] }
  | { success: false; error: string };

/** Server action response for `getTourBookingQuote`. */
export type GetTourBookingQuoteResult =
  | { success: true; data: BookingWidgetQuote }
  | { success: false; error: string };

/**
 * Server action response for `submitTourBookingRequest` (LOC-1056).
 * Success means team + customer emails were sent; failure includes a safe `error` string.
 */
export type SubmitTourBookingRequestResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Sanity country document structure
 */
export interface CountryDocument {
  _id: string;
  _type: "country";
  name: string;
  iso2: string;
  slug?: string;
}

/**
 * Sanity city document structure (with country support)
 */
export interface CityDocument {
  _id: string;
  _type: "city";
  name: string;
  cityCode: string;
  country: {
    _type: "reference";
    _ref: string;
  };
  countryCode: string;
  /** Relative tour URL for footer links, e.g. /tours/toledo/hello-toledo-123 */
  tourPagePath?: string;
}

/**
 * Result of syncing cities and countries from Bokun products to Sanity
 */
export interface CitySyncResult {
  countries: {
    created: string[]; // Array of country codes created
    updated: string[]; // Array of country codes updated
  };
  cities: {
    created: string[]; // Array of city codes created
    updated: string[]; // Array of city codes updated
    existing: string[]; // Array of city codes that already existed
    /** City codes whose Sanity `tourPagePath` was set from Bokun in this sync run */
    tourPagePathsPatched?: string[];
  };
  errors: Array<{
    type: "country" | "city";
    identifier: string; // countryCode or cityCode
    error: string;
  }>;
}
