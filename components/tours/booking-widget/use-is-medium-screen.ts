"use client";

/**
 * `matchMedia('(min-width: 1024px)')` hook for booking widget layout branching.
 *
 * Matches the tour page sidebar grid (`lg:grid-cols-3`). Defaults to `true` during
 * SSR so the lg+ sticky card hydrates first; updates on mount and when the
 * viewport crosses the `lg` breakpoint.
 */

import { useEffect, useState } from "react";

/** Tailwind `lg` breakpoint — sidebar layout and in-page sticky widget. */
export const BOOKING_WIDGET_LG_MEDIA_QUERY = "(min-width: 1024px)";

/** @deprecated Use {@link BOOKING_WIDGET_LG_MEDIA_QUERY}. */
export const BOOKING_WIDGET_MD_MEDIA_QUERY = BOOKING_WIDGET_LG_MEDIA_QUERY;

/**
 * Returns whether the viewport is at least Tailwind `lg` (1024px).
 *
 * @returns `true` for sidebar layout (sticky in-page card); `false` for bottom bar + drawer
 */
export function useIsMediumScreen(): boolean {
  // Match the server render; the effect below applies the real value on mount.
  const [isMediumScreen, setIsMediumScreen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia(BOOKING_WIDGET_LG_MEDIA_QUERY);
    const sync = () => setIsMediumScreen(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);
  return isMediumScreen;
}
