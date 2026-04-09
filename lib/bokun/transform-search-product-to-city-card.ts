import { slugifyForUrl } from "@/lib/utils";
import { CityCardData } from "@/types/bokun";

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

/** Map a Bokun search product to `CityCardData` (same rules as tour listing). */
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
