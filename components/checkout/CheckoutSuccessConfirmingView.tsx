/**
 * Checkout success — fulfilment in progress (LOC-1167 / PRD Task 4.3).
 *
 * Shown when Stripe payment succeeded but the webhook has not yet persisted the
 * Bókun product confirmation code. Polls via `router.refresh()` so the server
 * page can transition to the confirmed success view without a manual reload.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";

import {
  CHECKOUT_CARD_CLASS,
  CHECKOUT_CARD_PADDING_CLASS,
  CHECKOUT_INLINE_BUTTON_CLASS,
  CHECKOUT_PAGE_PADDING_CLASS,
  CHECKOUT_SUCCESS_MAX_WIDTH_CLASS,
} from "./checkout-field-styles";
import type { CheckoutOrderFixture } from "./checkout-mock-fixture";
import { OrderSummaryLineItem } from "./OrderSummaryLineItem";

/** How often to re-fetch the server page while fulfilment is pending. */
export const CHECKOUT_SUCCESS_CONFIRMING_POLL_MS = 3000;

/** Maximum poll duration before showing static guidance (2 minutes). */
export const CHECKOUT_SUCCESS_CONFIRMING_MAX_POLLS = 40;

/** Heading shown after polling exhausts without fulfilment. */
export const CHECKOUT_SUCCESS_CONFIRMING_TIMEOUT_TITLE =
  "This is taking longer than expected";

/** Guidance copy shown after polling exhausts without fulfilment. */
export const CHECKOUT_SUCCESS_CONFIRMING_TIMEOUT_MESSAGE =
  "Your payment was successful. We're still finalizing your reservation — please check your email for confirmation, or try refreshing this page in a moment.";

/** Primary CTA label to retry server refresh after polling times out. */
export const CHECKOUT_SUCCESS_CONFIRMING_RETRY_LABEL = "Check again";

/** Secondary CTA when confirmation is still pending after polling. */
export const CHECKOUT_SUCCESS_CONFIRMING_EXPLORE_HREF = "/explore";

/** Secondary CTA label when confirmation is still pending after polling. */
export const CHECKOUT_SUCCESS_CONFIRMING_EXPLORE_LABEL = "Browse tours";

export interface CheckoutSuccessConfirmingViewProps {
  order: CheckoutOrderFixture;
}

/**
 * Renders a loading success state while Bókun fulfilment completes.
 *
 * @param order - Tour recap from the pending checkout KV row
 */
export function CheckoutSuccessConfirmingView({
  order,
}: CheckoutSuccessConfirmingViewProps) {
  const router = useRouter();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const formattedTotal = formatCataloguePriceAmount(
    order.totalAmount,
    order.currency,
  );

  useEffect(() => {
    let pollCount = 0;

    const intervalId = window.setInterval(() => {
      pollCount += 1;
      if (pollCount > CHECKOUT_SUCCESS_CONFIRMING_MAX_POLLS) {
        window.clearInterval(intervalId);
        setHasTimedOut(true);
        return;
      }

      router.refresh();
    }, CHECKOUT_SUCCESS_CONFIRMING_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [router, retryKey]);

  const handleRetry = () => {
    setHasTimedOut(false);
    setRetryKey((current) => current + 1);
    router.refresh();
  };

  return (
    <main
      className={`flex flex-col items-center justify-center ${CHECKOUT_PAGE_PADDING_CLASS}`}
    >
      <div
        className={`flex w-full ${CHECKOUT_SUCCESS_MAX_WIDTH_CLASS} flex-col items-center text-center`}
      >
        {!hasTimedOut ? (
          <>
            <div
              className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-pearl-gray border-t-tangerine sm:mb-8"
              role="status"
              aria-label="Confirming your booking"
            />

            <h1 className="mb-4 text-3xl font-bold text-watermelon sm:text-4xl">
              Confirming your booking…
            </h1>
            <p className="mx-auto mb-10 max-w-lg text-base text-muted-foreground sm:mb-12">
              Your payment was successful. We&apos;re finalizing your reservation
              — this usually takes just a few seconds.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-4 text-3xl font-bold text-watermelon sm:text-4xl">
              {CHECKOUT_SUCCESS_CONFIRMING_TIMEOUT_TITLE}
            </h1>
            <p className="mx-auto mb-10 max-w-lg text-base text-muted-foreground sm:mb-12">
              {CHECKOUT_SUCCESS_CONFIRMING_TIMEOUT_MESSAGE}
            </p>
          </>
        )}

        <div
          className={`${CHECKOUT_CARD_CLASS} ${CHECKOUT_CARD_PADDING_CLASS} mb-8 flex w-full flex-col gap-6 bg-pearl-gray text-left`}
        >
          <h2 className="text-lg font-semibold text-watermelon sm:text-xl">
            Booking summary
          </h2>

          <Separator />

          <OrderSummaryLineItem
            imageUrl={order.imageUrl}
            imageAlt={order.imageAlt}
            title={order.title}
            dateLabel={order.dateLabel}
            timeLabel={order.timeLabel}
            participantsLabel={order.participantsLabel}
            priceAmount={order.totalAmount}
            currency={order.currency}
          />

          <Separator />

          <div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-lg font-bold text-nightsky">Total</span>
              <span className="text-lg font-bold text-nightsky">
                {formattedTotal ?? "—"}
              </span>
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">
              All taxes and fees included
            </p>
          </div>
        </div>

        {hasTimedOut ? (
          <div className="flex w-full flex-col items-center gap-4">
            <Button
              type="button"
              className={CHECKOUT_INLINE_BUTTON_CLASS}
              size="lg"
              onClick={handleRetry}
            >
              {CHECKOUT_SUCCESS_CONFIRMING_RETRY_LABEL}
            </Button>
            <Button
              asChild
              variant="outline"
              className={CHECKOUT_INLINE_BUTTON_CLASS}
              size="lg"
            >
              <Link href={CHECKOUT_SUCCESS_CONFIRMING_EXPLORE_HREF}>
                {CHECKOUT_SUCCESS_CONFIRMING_EXPLORE_LABEL}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
