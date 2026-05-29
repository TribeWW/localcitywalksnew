import { slugifyForUrl } from "@/lib/utils";
import { toBokunProductIdDigits } from "@/lib/utils/bokun-product-id";
import { pickBokunCardImageUrl } from "@/lib/bokun/pick-bokun-card-image-url";
import { CityCardData } from "@/types/bokun";

/**
 * Convert a Bokun search product object into a CityCardData representation for city cards.
 *
 * @param product - Source product object expected to contain `id`, `title`, `keyPhoto`, and optional `googlePlace` with `city`, `country`, and `countryCode`. `title` is used as a fallback when `googlePlace.city` is not present.
 * @returns A CityCardData object containing:
 * - `id`: the product id
 * - `title`: the resolved city name
 * - `image`: thumbnail URL derived from `keyPhoto` (falls back to `"/placeholder-city.jpg"` when unavailable)
 * - `countryCode`: the `googlePlace.countryCode` or `""`
 * - `country`: the `googlePlace.country` or `"Unknown"`
 * - `citySlug`: slugified city name
 * - `slug`: slug that is `product.id` when the title slugifies to `"unknown"`, otherwise `"{titleSlug}-{id}"`
 */
export function transformSearchProductToCityCard(product: unknown): CityCardData {
  const productData = product as {
    id: string | number;
    title: string;
    keyPhoto: unknown;
    googlePlace?: { city: string; country: string; countryCode: string };
  };
  const productId =
    toBokunProductIdDigits(productData.id) ?? String(productData.id ?? "");
  const cityName = productData.googlePlace?.city ?? productData.title;
  const citySlug = slugifyForUrl(cityName);
  const titleSlug = slugifyForUrl(productData.title);
  const slug =
    titleSlug === "unknown" ? productId : `${titleSlug}-${productId}`;
  return {
    id: productId,
    title: cityName,
    image: pickBokunCardImageUrl(productData.keyPhoto),
    countryCode: productData.googlePlace?.countryCode ?? "",
    country: productData.googlePlace?.country ?? "Unknown",
    citySlug,
    slug,
  };
}
