import type { ReactNode } from "react";

import {
  CHECKOUT_PAGE_PADDING_CLASS,
  CHECKOUT_SUMMARY_GRID_CLASS,
  CHECKOUT_SUMMARY_MAX_WIDTH_CLASS,
} from "./checkout-field-styles";

/**
 * Two-column checkout summary page shell (LOC-1147).
 *
 * Root layout already provides site Navbar/Footer; this component wraps the
 * main content area per design brief §3.1 (1140px max, 1.4fr / 1fr grid).
 */

export interface CheckoutPageLayoutProps {
  /** Left column: contact + payment sections. */
  leftColumn: ReactNode;
  /** Right column: order summary card (sticky on desktop). */
  rightColumn: ReactNode;
}

/**
 * Renders the checkout summary grid: stacked on mobile, two columns from 960px.
 */
export function CheckoutPageLayout({
  leftColumn,
  rightColumn,
}: CheckoutPageLayoutProps) {
  return (
    <main
      className={`mx-auto ${CHECKOUT_SUMMARY_MAX_WIDTH_CLASS} ${CHECKOUT_PAGE_PADDING_CLASS}`}
    >
      <div className={CHECKOUT_SUMMARY_GRID_CLASS}>
        <div className="flex flex-col gap-8 min-[960px]:gap-12">{leftColumn}</div>
        <div className="min-[960px]:sticky min-[960px]:top-8">{rightColumn}</div>
      </div>
    </main>
  );
}
