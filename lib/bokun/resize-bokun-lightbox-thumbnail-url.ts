const LIGHTBOX_THUMB_WIDTH = 160;
const LIGHTBOX_THUMB_HEIGHT = 112;

/**
 * Derives a small Bókun CDN address for lightbox thumbnails (160 by 112).
 * Non CDN addresses pass through unchanged.
 */
export function resizeBokunLightboxThumbnailUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "imgcdn.bokun.tools") {
      return url;
    }

    parsed.searchParams.set("w", String(LIGHTBOX_THUMB_WIDTH));
    parsed.searchParams.set("h", String(LIGHTBOX_THUMB_HEIGHT));
    return parsed.toString();
  } catch {
    return url;
  }
}
