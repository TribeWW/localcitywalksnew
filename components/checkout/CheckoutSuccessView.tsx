/**
 * Checkout success screen — confirmation hero and booking recap (LOC-1148).
 */

import Image from "next/image";
import Link from "next/link";

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
import {
  CHECKOUT_SUCCESS_ILLUSTRATION_URL,
  type CheckoutOrderFixture,
} from "./checkout-mock-fixture";
import { OrderSummaryLineItem } from "./OrderSummaryLineItem";

export interface CheckoutSuccessViewProps {
  bookingReference: string;
  order: CheckoutOrderFixture;
  /** Destination for "Take me home" CTA (default `/`). */
  homeHref?: string;
  /** Override success hero illustration URL. */
  illustrationUrl?: string;
}

/**
 * Renders the post-payment success layout with booking reference and tour recap.
 */
export function CheckoutSuccessView({
  bookingReference,
  order,
  homeHref = "/",
  illustrationUrl = CHECKOUT_SUCCESS_ILLUSTRATION_URL,
}: CheckoutSuccessViewProps) {
  const formattedTotal = formatCataloguePriceAmount(
    order.totalAmount,
    order.currency,
  );

  return (
    <main
      className={`flex flex-col items-center justify-center ${CHECKOUT_PAGE_PADDING_CLASS}`}
    >
      <div
        className={`flex w-full ${CHECKOUT_SUCCESS_MAX_WIDTH_CLASS} flex-col items-center text-center`}
      >
        <Image
          src={illustrationUrl}
          alt="LocalCityWalks guide making a heart"
          width={192}
          height={192}
          unoptimized
          className="mb-6 h-auto w-36 sm:mb-8 sm:w-48"
        />

        <h1 className="mb-4 text-3xl font-bold text-watermelon sm:text-4xl">
          You&apos;re all set!
        </h1>
        <p className="mb-2 text-lg font-medium text-watermelon sm:text-xl">
          Thank you for booking with LocalCityWalks.
        </p>
        <p className="mx-auto mb-10 max-w-lg text-base text-muted-foreground sm:mb-12">
          Please check your inbox for the booking confirmation — and your spam
          folder, just in case. We can&apos;t wait to welcome you!
        </p>

        <div
          className={`${CHECKOUT_CARD_CLASS} ${CHECKOUT_CARD_PADDING_CLASS} mb-8 flex w-full flex-col gap-6 bg-pearl-gray text-left`}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h2 className="text-lg font-semibold text-watermelon sm:text-xl">
              Booking summary
            </h2>
            <span className="text-sm text-muted-foreground break-all sm:break-normal">
              Ref: {bookingReference}
            </span>
          </div>

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

        <Button asChild className={CHECKOUT_INLINE_BUTTON_CLASS} size="lg">
          <Link href={homeHref}>Take me home</Link>
        </Button>
      </div>
    </main>
  );
}
