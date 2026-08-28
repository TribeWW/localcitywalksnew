"use client";

/**
 * `matchMedia('(min-width: 768px)')` hook for booking widget layout branching.
 *
 * Defaults to `true` during SSR so the md+ sticky card hydrates first; updates
 * on mount and when the viewport crosses the `md` breakpoint.
 */

import { useEffect, useState } from "react";

/** Tailwind `md` breakpoint — medium screens and up use the in-page sticky card. */
export const BOOKING_WIDGET_MD_MEDIA_QUERY = "(min-width: 768px)";

/**
 * Returns whether the viewport is at least Tailwind `md` (768px).
 *
 * @returns `true` for medium+ viewports (in-page widget); `false` for small screens (bottom bar + drawer)
 */
export function useIsMediumScreen(): boolean {
  // Match the server render; the effect below applies the real value on mount.
  const [isMediumScreen, setIsMediumScreen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia(BOOKING_WIDGET_MD_MEDIA_QUERY);
    const sync = () => setIsMediumScreen(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);
  return isMediumScreen;
}
