import type { ReactNode } from "react";

import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

/**
 * Quiet checkout chrome (logo-only nav + legal footer), matching `app/not-found.tsx`.
 *
 * No Sanity / promo fetch — the promo bar must never mount on checkout routes.
 * Checkout pages move under this group in Phase 1 Task 3.
 */
export default function CheckoutGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-nightsky">
      <Navbar variant="minimal" />
      {children}
      <Footer variant="minimal" />
    </div>
  );
}
