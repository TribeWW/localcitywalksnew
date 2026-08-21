import type { ReactNode } from "react";

/**
 * Pass-through layout for all `(site)` routes.
 *
 * Chrome (Navbar / Footer / PromoBanner) lives in nested route-group layouts:
 * `(marketing)` for browse pages and `(checkout)` for quiet checkout chrome.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return children;
}
