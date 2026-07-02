"use client";

/**
 * Pre-submit booking review panel (LOC-1054).
 *
 * Renders date, time, participants, language, and total above the submit button
 * so customers can confirm selections before sending the request.
 */

import { format } from "date-fns";
import { formatParticipantSummary } from "@/lib/booking/format-participant-summary";
import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import { formatBokunLanguage } from "@/lib/utils/format-bokun-language";
import type {
  BookingWidgetParticipants,
  BookingWidgetQuote,
} from "@/types/bokun";

/** Props for `BookingSubmitSummary`. */
export interface BookingSubmitSummaryProps {
  /** Selected tour date from the date picker. */
  date?: Date;
  /** Display label for the chosen start time (e.g. `11:00`). */
  startTimeLabel?: string;
  /** Current participant counters from the widget form. */
  participants: BookingWidgetParticipants;
  /** Selected Bókun guided language code, when applicable. */
  languageCode?: string;
  /** Live quote from `getTourBookingQuote`; required to render the summary. */
  quote: BookingWidgetQuote | null;
}

/**
 * Review block shown immediately above the submit button when a quote is ready.
 *
 * @param props - Selected slot, participants, optional language, and computed quote
 */
export default function BookingSubmitSummary({
  date,
  startTimeLabel,
  participants,
  languageCode,
  quote,
}: BookingSubmitSummaryProps) {
  if (!quote || !date || !startTimeLabel) {
    return null;
  }

  const formattedTotal = formatCataloguePriceAmount(
    quote.totalAmount,
    quote.currency,
  );
  if (!formattedTotal) {
    return null;
  }

  const participantSummary = formatParticipantSummary(participants);
  const languageLabel = languageCode?.trim()
    ? formatBokunLanguage(languageCode)
    : null;

  return (
    <section
      aria-label="Booking summary"
      className="rounded-lg border border-border bg-white px-4 py-3 space-y-2"
    >
      <h3 className="text-sm font-semibold text-nightsky">Your booking</h3>
      <dl className="space-y-1 text-sm text-nightsky">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-medium text-right">{format(date, "PPP")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Time</dt>
          <dd className="font-medium text-right">{startTimeLabel}</dd>
        </div>
        {participantSummary ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Participants</dt>
            <dd className="font-medium text-right">{participantSummary}</dd>
          </div>
        ) : null}
        {languageLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Language</dt>
            <dd className="font-medium text-right">{languageLabel}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 border-t border-border pt-2">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold text-tangerine text-right">
            {formattedTotal}
          </dd>
        </div>
      </dl>
    </section>
  );
}
