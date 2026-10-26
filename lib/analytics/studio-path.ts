/** True for Sanity Studio routes (`/studio` and nested tools). */
export function isSanityStudioPath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === "/studio" || pathname.startsWith("/studio/");
}

export function pathnameFromUrl(
  url: string,
  base: string = "http://localhost",
): string {
  try {
    return new URL(url, base).pathname;
  } catch {
    return "";
  }
}
