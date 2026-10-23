import { client } from "@/sanity/lib/client";
import { getRecentReviews } from "@/lib/reviews/reviews.actions";
import type { HomeReviewListItem, SanityReviewListItem } from "@/types/review";

/** Recent published reviews read before text and city filters. */
export const HOME_REVIEW_FETCH_LIMIT = 24;

/** Cards returned to the home carousel after filters. */
export const HOME_REVIEW_RETURN_LIMIT = 12;

const DRAFT_EXCLUDED = `!(_id in path("drafts.**"))`;

const HOME_REVIEW_CITIES_QUERY = `*[_type == "city" && defined(tourPagePath) && ${DRAFT_EXCLUDED}] {
  "name": name,
  "tourPagePath": tourPagePath,
  "countryName": country->name
}`;

const TOUR_ID_SUFFIX = /-(\d+)$/;
const DIGITS_ONLY = /^\d+$/;

export type HomeReviewCityRow = {
  name?: string | null;
  tourPagePath?: string | null;
  countryName?: string | null;
};

type IndexedCity = {
  cityName: string;
  countryName: string;
  cityHref: string;
};

/**
 * Numeric id after the last hyphen, only when the path is a catalogue tour path
 * that ends with that id.
 */
export function tourIdFromTourPagePath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/tours/")) return null;
  const match = TOUR_ID_SUFFIX.exec(trimmed);
  return match?.[1] ?? null;
}

function indexUniqueCities(
  rows: readonly HomeReviewCityRow[] | null | undefined,
): Map<string, IndexedCity> {
  const counts = new Map<string, { count: number; city: IndexedCity | null }>();

  for (const row of rows ?? []) {
    const href = row.tourPagePath?.trim() ?? "";
    const tourId = tourIdFromTourPagePath(href);
    if (!tourId) continue;

    const cityName = row.name?.trim() ?? "";
    const countryName = row.countryName?.trim() ?? "";
    const complete = cityName.length > 0 && countryName.length > 0;
    const existing = counts.get(tourId);

    if (!existing) {
      counts.set(tourId, {
        count: 1,
        city: complete ? { cityName, countryName, cityHref: href } : null,
      });
      continue;
    }

    existing.count += 1;
    existing.city = null;
  }

  const unique = new Map<string, IndexedCity>();
  for (const [tourId, entry] of counts) {
    if (entry.count === 1 && entry.city) unique.set(tourId, entry.city);
  }
  return unique;
}

/**
 * Keep written reviews that match exactly one published city, in input order,
 * then cap the list.
 */
export function selectHomeReviews(
  reviews: readonly SanityReviewListItem[] | null | undefined,
  cities: readonly HomeReviewCityRow[] | null | undefined,
  returnLimit: number = HOME_REVIEW_RETURN_LIMIT,
): HomeReviewListItem[] {
  const byTourId = indexUniqueCities(cities);
  const selected: HomeReviewListItem[] = [];
  const cap = Math.max(0, returnLimit);

  for (const review of reviews ?? []) {
    if (selected.length >= cap) break;

    const body = review.body?.trim() ?? "";
    if (!body) continue;

    const tourId = review.tourId?.trim() ?? "";
    if (!DIGITS_ONLY.test(tourId)) continue;

    const city = byTourId.get(tourId);
    if (!city) continue;

    selected.push({
      _id: review._id,
      tourId,
      rating: review.rating,
      experienceDate: review.experienceDate,
      authorName: review.authorName,
      body,
      cityName: city.cityName,
      countryName: city.countryName,
      cityHref: city.cityHref,
    });
  }

  return selected;
}

/**
 * Home reviews for the carousel. A Sanity failure logs and returns no cards,
 * so the section can hide instead of showing a heading with nothing under it.
 */
export async function loadHomeReviews(): Promise<HomeReviewListItem[]> {
  try {
    const [reviews, cities] = await Promise.all([
      getRecentReviews(HOME_REVIEW_FETCH_LIMIT),
      client.fetch<HomeReviewCityRow[]>(HOME_REVIEW_CITIES_QUERY),
    ]);

    return selectHomeReviews(
      Array.isArray(reviews) ? reviews : [],
      Array.isArray(cities) ? cities : [],
    );
  } catch (e) {
    console.error("[Home reviews] enrich failed", e);
    return [];
  }
}
