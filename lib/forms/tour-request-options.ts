/** Static option lists for the custom tour request form. */

export const TOUR_REQUEST_TIME_OPTIONS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "Flexible / not sure yet",
] as const;

export const TOUR_REQUEST_DURATION_OPTIONS = [
  "1 hour",
  "1.5 hours",
  "2 hours",
  "3 hours",
  "Half day",
  "Full day",
  "Flexible / not sure yet",
] as const;

export const TOUR_REQUEST_LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "German",
  "French",
  "Italian",
  "Dutch",
  "Portuguese",
  "Other",
] as const;

export type TourRequestTimeOption = (typeof TOUR_REQUEST_TIME_OPTIONS)[number];
export type TourRequestDurationOption =
  (typeof TOUR_REQUEST_DURATION_OPTIONS)[number];
export type TourRequestLanguageOption =
  (typeof TOUR_REQUEST_LANGUAGE_OPTIONS)[number];

/** Select options shaped for `TimeSelector` / `DurationSelector`. */
export const TOUR_REQUEST_TIME_SELECT_OPTIONS = TOUR_REQUEST_TIME_OPTIONS.map(
  (value) => ({ value, label: value }),
);

export const TOUR_REQUEST_DURATION_SELECT_OPTIONS =
  TOUR_REQUEST_DURATION_OPTIONS.map((value) => ({ value, label: value }));
