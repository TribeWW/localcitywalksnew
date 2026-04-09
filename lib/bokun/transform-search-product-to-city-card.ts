import { slugifyForUrl } from "@/lib/utils";
import { CityCardData } from "@/types/bokun";

/**
 * Extracts a thumbnail URL from a Bokun `keyPhoto` structure.
 *
 * @param keyPhoto - An object that may include a `derived` array of `{ name: string; url: string }` entries.
 * @returns The `url` of the `derived` entry named `"preview"` if present; otherwise the first available `derived` `url`; if none found, `"/placeholder-city.jpg"`.
 */
function extractThumbnailUrl(keyPhoto: unknown): string {
  const photoData = keyPhoto as {
    derived?: Array<{ name: string; url: string }>;
  };

  if (!photoData?.derived) {
    return "/placeholder-city.jpg";
  }

  const thumbnail = photoData.derived.find((item) => item.name === "preview");

  if (thumbnail?.url) {
    return thumbnail.url;
  }

  const firstDerived = photoData.derived.find((item) => item.url);
  return firstDerived?.url || "/placeholder-city.jpg";
}

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
    id: string;
    title: string;
    keyPhoto: unknown;
    googlePlace?: { city: string; country: string; countryCode: string };
  };
  const cityName = productData.googlePlace?.city ?? productData.title;
  const citySlug = slugifyForUrl(cityName);
  const titleSlug = slugifyForUrl(productData.title);
  const slug =
    titleSlug === "unknown" ? productData.id : `${titleSlug}-${productData.id}`;
  return {
    id: productData.id,
    title: cityName,
    image: extractThumbnailUrl(productData.keyPhoto),
    countryCode: productData.googlePlace?.countryCode ?? "",
    country: productData.googlePlace?.country ?? "Unknown",
    citySlug,
    slug,
  };
}
