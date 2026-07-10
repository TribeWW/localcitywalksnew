import { slugifyForUrl } from "@/lib/utils";
import { toBokunProductIdDigits } from "@/lib/utils/bokun-product-id";
import { pickBokunCardImageUrl } from "@/lib/bokun/pick-bokun-card-image-url";
import { CityCardData } from "@/types/bokun";

/**
 * Convert a Bokun search product object into a CityCardData representation for city cards.
 *
 * @param product - Source product object expected to contain `id`, `title`, `keyPhoto`, and optional `googlePlace` with `city`, `country`, and `countryCode`. `googlePlace.city` is used when the product title is missing.
 * @returns A CityCardData object containing:
 * - `id`: normalized digits-only product id from `toBokunProductIdDigits` (falls back to `String(product.id)` when normalization fails)
 * - `title`: the Bókun product title (fallback: city name)
 * - `cityName`: `googlePlace.city` when present (for image alt)
 * - `image`: card image URL from `pickBokunCardImageUrl(keyPhoto)` (that helper applies its own fallback)
 * - `countryCode`: the `googlePlace.countryCode` or `""`
 * - `country`: the `googlePlace.country` or `"Unknown"`
 * - `citySlug`: slugified city name
 * - `slug`: normalized id when the title slugifies to `"unknown"`, otherwise `"{titleSlug}-{normalizedId}"`
 */
export function transformSearchProductToCityCard(
  product: unknown,
): CityCardData {
  const productData = product as {
    id: string | number;
    title: string;
    keyPhoto: unknown;
    defaultRateId?: number;
    googlePlace?: { city: string; country: string; countryCode: string };
  };
  const productId =
    toBokunProductIdDigits(productData.id) ?? String(productData.id ?? "");

  if (!productId) {
    throw new Error(
      `[transform] Product must have a valid ID: ${JSON.stringify(productData)}`,
    );
  }
  const cityName = productData.googlePlace?.city?.trim();
  const productTitle = productData.title?.trim();
  const displayTitle = productTitle || cityName || "Tour";
  const citySlug = slugifyForUrl(cityName ?? displayTitle);
  const titleSlug = slugifyForUrl(productData.title);
  const slug =
    titleSlug === "unknown" ? productId : `${titleSlug}-${productId}`;
  return {
    id: productId,
    title: displayTitle,
    image: pickBokunCardImageUrl(productData.keyPhoto),
    countryCode: productData.googlePlace?.countryCode ?? "",
    country: productData.googlePlace?.country ?? "Unknown",
    ...(cityName ? { cityName } : {}),
    citySlug,
    slug,
    ...(productData.defaultRateId != null
      ? { defaultRateId: productData.defaultRateId }
      : {}),
  };
}
