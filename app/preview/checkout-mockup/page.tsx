import type { Metadata } from "next";

import { CheckoutMockupPreview } from "@/components/checkout/CheckoutMockupPreview";

export const metadata: Metadata = {
  title: "Checkout mockup",
  description:
    "Temporary design preview for checkout summary and success layouts — not linked from production nav.",
  robots: { index: false, follow: false },
};

/**
 * Throwaway checkout UI preview — static Hello Palma fixture, no backend.
 */
export default function CheckoutMockupPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border bg-pearl-gray px-4 py-3 text-center text-sm text-muted-foreground">
        Mockup only — preview at{" "}
        <span className="font-mono text-foreground">
          /preview/checkout-mockup
        </span>
      </div>
      <CheckoutMockupPreview />
    </div>
  );
}
