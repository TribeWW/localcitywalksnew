/**
 * tour-seo-fallbacks — city-templated SEO copy when Sanity override fields are empty.
 *
 * Templates live in code (not Sanity) and are interpolated with the tour city from Bokun.
 */

/** Resolved fallback fields for a single tour page. */
export type TourSeoFallbacks = {
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
};

/** Title template when a city name is available (`{City}` = trimmed Bokun city). */
export const TOUR_SEO_TITLE_WITH_CITY =
  "{City} Private Walking Tour | LocalCityWalks";

/** Title template when Bokun does not provide a city name. */
export const TOUR_SEO_TITLE_WITHOUT_CITY =
  "Private Walking Tour | LocalCityWalks";

/** Meta description template when a city name is available. */
export const TOUR_SEO_DESCRIPTION_WITH_CITY =
  "Discover {City} with a vetted local guide on this private walking tour. Small groups, hidden corners, and authentic local stories await.";

/** Meta description template when Bokun does not provide a city name. */
export const TOUR_SEO_DESCRIPTION_WITHOUT_CITY =
  "Discover this city with a vetted local guide on this private walking tour. Small groups, hidden corners, and authentic local stories await.";

/** Focus keyword template when a city name is available (`{city}` = lowercase city). */
export const TOUR_SEO_KEYWORD_WITH_CITY = "{city} private walking tour";

/** Focus keyword when Bokun does not provide a city name. */
export const TOUR_SEO_KEYWORD_WITHOUT_CITY = "private walking tour";

/**
 * Replaces `{City}` / `{city}` placeholders in a template string.
 *
 * @param template - Copy template containing `{City}` and/or `{city}` tokens
 * @param cityName - Trimmed city display name from Bokun `googlePlace.city`
 */
function interpolateCityTemplate(template: string, cityName: string): string {
  return template
    .replaceAll("{City}", cityName)
    .replaceAll("{city}", cityName.toLowerCase());
}

/**
 * Builds default Tour SEO title, description, and focus keyword for a tour city.
 *
 * When `cityName` is missing or blank, returns graceful copy without a city segment.
 *
 * @param cityName - City from Bokun `googlePlace.city`, or null/undefined when absent
 */
export function buildTourSeoFallbacks(
  cityName: string | null | undefined,
): TourSeoFallbacks {
  const trimmed = cityName?.trim();
  if (!trimmed) {
    return {
      seoTitle: TOUR_SEO_TITLE_WITHOUT_CITY,
      metaDescription: TOUR_SEO_DESCRIPTION_WITHOUT_CITY,
      focusKeyword: TOUR_SEO_KEYWORD_WITHOUT_CITY,
    };
  }

  return {
    seoTitle: interpolateCityTemplate(TOUR_SEO_TITLE_WITH_CITY, trimmed),
    metaDescription: interpolateCityTemplate(
      TOUR_SEO_DESCRIPTION_WITH_CITY,
      trimmed,
    ),
    focusKeyword: interpolateCityTemplate(TOUR_SEO_KEYWORD_WITH_CITY, trimmed),
  };
}
