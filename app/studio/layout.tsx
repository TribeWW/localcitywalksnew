import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Layout wrapper for Sanity Studio — not intended for search indexing. */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
