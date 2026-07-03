import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CHECKOUT_INLINE_BUTTON_CLASS } from "@/components/checkout/checkout-field-styles";

export interface CheckoutHandoffErrorViewProps {
  /** Page heading — defaults to "Checkout unavailable". */
  title?: string;
  /** User-facing explanation for the handoff failure. */
  message: string;
  /** Link target — tour page or `/explore` fallback. */
  tourPageHref: string;
}

/**
 * Renders a recoverable checkout handoff error with a return CTA (LOC-1154 / LOC-1155).
 */
export function CheckoutHandoffErrorView({
  title = "Checkout unavailable",
  message,
  tourPageHref,
}: CheckoutHandoffErrorViewProps) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="mb-4 text-2xl font-semibold text-watermelon">{title}</h1>
      <p className="mb-8 text-base text-muted-foreground">{message}</p>
      <Button asChild className={CHECKOUT_INLINE_BUTTON_CLASS} size="lg">
        <Link href={tourPageHref}>Return to tour</Link>
      </Button>
    </main>
  );
}
