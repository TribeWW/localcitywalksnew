import type { ReactNode } from "react";

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
 * Renders the checkout summary grid: stacked on mobile, two columns from 961px.
 */
export function CheckoutPageLayout({
  leftColumn,
  rightColumn,
}: CheckoutPageLayoutProps) {
  return (
    <main className="mx-auto max-w-[1140px] px-6 pt-12 pb-20">
      <div className="grid grid-cols-1 items-start gap-8 min-[961px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] min-[961px]:gap-12">
        <div className="flex flex-col gap-12">{leftColumn}</div>
        <div className="min-[961px]:sticky min-[961px]:top-8">{rightColumn}</div>
      </div>
    </main>
  );
}
