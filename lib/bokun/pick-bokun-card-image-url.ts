const CARD_IMAGE_DERIVED_PREFERENCE = ["large", "preview", "thumbnail"] as const;
const BOKUN_CARD_IMAGE_WIDTH = 960;

/** Upscale Bókun CDN URLs for listing card sharpness (also fixes cached preview URLs). */
export function upsizeBokunCardImageUrl(url: string, width = BOKUN_CARD_IMAGE_WIDTH): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("bokun")) {
      return url;
    }

    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("h", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Picks the best Bókun `keyPhoto.derived` URL for listing cards (prefers `large`).
 */
export function pickBokunCardImageUrl(keyPhoto: unknown): string {
  const photoData = keyPhoto as {
    derived?: Array<{ name: string; url: string }>;
  };

  if (!photoData?.derived?.length) {
    return "/placeholder-city.jpg";
  }

  for (const preferredName of CARD_IMAGE_DERIVED_PREFERENCE) {
    const match = photoData.derived.find(
      (item) => item.name === preferredName && item.url,
    );
    if (match?.url) {
      return upsizeBokunCardImageUrl(match.url);
    }
  }

  const firstDerived = photoData.derived.find((item) => item.url);
  return firstDerived?.url
    ? upsizeBokunCardImageUrl(firstDerived.url)
    : "/placeholder-city.jpg";
}
