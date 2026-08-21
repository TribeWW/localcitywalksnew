import type { ReactNode } from "react";

import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

/**
 * Full browse chrome for marketing routes (home, explore, tours).
 *
 * PromoBanner is wired in Phase 3 above the Navbar when an offer is active.
 * Pages move under this group in Phase 1 Task 5.
 */
export default function MarketingGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
