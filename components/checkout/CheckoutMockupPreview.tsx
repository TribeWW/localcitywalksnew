"use client";

/**
 * Tab switcher for checkout mockup preview (LOC-1149).
 */

import { useState } from "react";

import {
  CheckoutSuccessView,
  CheckoutSummaryView,
  HELLO_PALMA_CHECKOUT_FIXTURE,
  MOCK_BOOKING_REFERENCE,
} from "@/components/checkout";
import { cn } from "@/lib/utils";

type CheckoutMockupTab = "summary" | "success";

const TABS: { id: CheckoutMockupTab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "success", label: "Success" },
];

/**
 * Renders Summary or Success checkout views with static Hello Palma fixture.
 */
export function CheckoutMockupPreview() {
  const [activeTab, setActiveTab] = useState<CheckoutMockupTab>("summary");

  return (
    <>
      <nav
        className="border-b border-border bg-white px-4 py-3"
        aria-label="Checkout mockup screens"
      >
        <div className="mx-auto flex max-w-[1140px] flex-wrap justify-center gap-2 px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-tangerine text-white"
                  : "text-muted-foreground hover:bg-pearl-gray hover:text-foreground",
              )}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "summary" ? (
        <CheckoutSummaryView order={HELLO_PALMA_CHECKOUT_FIXTURE} />
      ) : (
        <CheckoutSuccessView
          bookingReference={MOCK_BOOKING_REFERENCE}
          order={HELLO_PALMA_CHECKOUT_FIXTURE}
        />
      )}
    </>
  );
}
