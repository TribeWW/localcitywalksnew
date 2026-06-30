import Image from "next/image";

import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import { cn } from "@/lib/utils";

/**
 * Single tour row in the checkout order summary (LOC-1147).
 */

export interface OrderSummaryLineItemProps {
  /** Tour thumbnail URL. */
  imageUrl: string;
  /** Accessible alt text for the thumbnail. */
  imageAlt: string;
  /** Full product title. */
  title: string;
  /** Formatted date label, e.g. "Wed, 21 Mar 2026". */
  dateLabel: string;
  /** Formatted start time, e.g. "11:00 AM". */
  timeLabel: string;
  /** Human-readable participant summary. */
  participantsLabel: string;
  /** Line total in major currency units (matches widget quote amounts). */
  priceAmount: number;
  /** ISO currency code, e.g. "EUR". */
  currency: string;
  /** Optional classes on the root element. */
  className?: string;
}

/**
 * Renders one tour line item with thumbnail, metadata, and formatted price.
 */
export function OrderSummaryLineItem({
  imageUrl,
  imageAlt,
  title,
  dateLabel,
  timeLabel,
  participantsLabel,
  priceAmount,
  currency,
  className,
}: OrderSummaryLineItemProps) {
  const formattedPrice = formatCataloguePriceAmount(priceAmount, currency);

  return (
    <article className={cn("flex gap-4", className)}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-pearl-gray">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          unoptimized
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-sm font-medium leading-snug text-nightsky">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {dateLabel} · {timeLabel}
        </p>
        <p className="text-sm text-muted-foreground">{participantsLabel}</p>
        {formattedPrice ? (
          <p className="text-sm font-semibold text-nightsky">{formattedPrice}</p>
        ) : null}
      </div>
    </article>
  );
}
