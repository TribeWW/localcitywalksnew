"use client";

/**
 * Configure step for the tour booking widget (LOC-1063).
 *
 * Shared between the md+ sticky sidebar card and the small-screen full-screen
 * drawer so date/time/language/guests/breakdown never drift apart.
 */

import { Calendar, Clock, MessagesSquare } from "lucide-react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import BookingWidgetFromPrice from "@/components/tours/booking-widget/BookingWidgetFromPrice";
import BookingWidgetField from "@/components/tours/booking-widget/BookingWidgetField";
import BookingGuestsPicker from "@/components/tours/booking-widget/BookingGuestsPicker";
import BookingWidgetBreakdown from "@/components/tours/booking-widget/BookingWidgetBreakdown";
import BookingWidgetStepOneFooter from "@/components/tours/booking-widget/BookingWidgetStepOneFooter";
import type { GuestCategoryKey } from "@/components/tours/booking-widget/guest-categories";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import DatePicker from "@/components/ui/date-picker";
import TimeSelector from "@/components/ui/time-selector";
import LanguageSelector from "@/components/tours/LanguageSelector";
import type {
  BookingWidgetLanguageOption,
  BookingWidgetParticipants,
  BookingWidgetQuote,
} from "@/types/bokun";
import type { BookingWidgetQuoteErrorState } from "@/lib/booking/max-group-size-message";

/** Minimal form shape required by the configure step fields. */
export interface BookingWidgetConfigureFormValues {
  preferredDate?: Date;
  startTimeId?: string;
  language?: string;
  adults: number;
  youth: number;
  children: number;
  infants: number;
}

/** Props for {@link BookingWidgetConfigureStep}. */
export interface BookingWidgetConfigureStepProps<
  TFieldValues extends BookingWidgetConfigureFormValues & FieldValues =
    BookingWidgetConfigureFormValues,
> {
  /** When true, renders the “From €X per adult” headline (md+ shell). */
  showFromPrice?: boolean;
  fromPriceAmount?: number;
  fromPriceCurrency?: string;
  availError: string | null;
  availLoading: boolean;
  /** Parent `useForm` instance (configure + hidden contact fields). */
  form: UseFormReturn<TFieldValues>;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (date: Date) => boolean;
  preferredDate?: Date;
  timeOptions: { value: string; label: string }[];
  languageOptions: BookingWidgetLanguageOption[];
  participants: BookingWidgetParticipants;
  onParticipantChange: (key: GuestCategoryKey, value: number) => void;
  quote: BookingWidgetQuote | null;
  quoteLoading: boolean;
  quoteError: BookingWidgetQuoteErrorState;
  isLanguageReady: boolean;
  maxGroupSize: number | null | undefined;
  belowMinParticipants: boolean;
  minParticipantsRequired: number;
  canBookNow: boolean;
  continuingToCheckout: boolean;
  onContinueToCheckout: () => void;
}

/**
 * Renders date, time, language, guests, price breakdown, and checkout CTA.
 *
 * @param props.showFromPrice - `false` inside the mobile drawer (price shown in bottom bar)
 */
export default function BookingWidgetConfigureStep<
  TFieldValues extends BookingWidgetConfigureFormValues & FieldValues =
    BookingWidgetConfigureFormValues,
>({
  showFromPrice = true,
  fromPriceAmount,
  fromPriceCurrency,
  availError,
  availLoading,
  form,
  minDate,
  maxDate,
  isDateDisabled,
  preferredDate,
  timeOptions,
  languageOptions,
  participants,
  onParticipantChange,
  quote,
  quoteLoading,
  quoteError,
  isLanguageReady,
  maxGroupSize,
  belowMinParticipants,
  minParticipantsRequired,
  canBookNow,
  continuingToCheckout,
  onContinueToCheckout,
}: BookingWidgetConfigureStepProps<TFieldValues>) {
  const startTimeIdValue = form.watch("startTimeId");

  return (
    <>
      {showFromPrice ? (
        <BookingWidgetFromPrice
          amount={fromPriceAmount}
          currency={fromPriceCurrency}
        />
      ) : null}

      <div
        className={
          showFromPrice && fromPriceAmount != null
            ? "mt-6 space-y-3"
            : "mt-0 space-y-3"
        }
      >
        {availError ? (
          <p className="text-sm text-destructive" role="alert">
            {availError}
          </p>
        ) : null}

        {availLoading ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Loading available dates…
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="preferredDate"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <BookingWidgetField icon={Calendar}>
                  <DatePicker
                    value={field.value}
                    onChange={(date) => {
                      field.onChange(date);
                      form.setValue("startTimeId", undefined);
                      form.setValue("language", undefined);
                    }}
                    placeholder="Select a date"
                    minDate={minDate}
                    maxDate={maxDate}
                    isDateDisabled={isDateDisabled}
                    disabled={availLoading}
                    variant="widget"
                    hideLeadingIcon
                  />
                </BookingWidgetField>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startTimeId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <BookingWidgetField icon={Clock}>
                  <TimeSelector
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select time"
                    options={timeOptions}
                    disabled={!preferredDate || timeOptions.length === 0}
                    variant="widget"
                  />
                </BookingWidgetField>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {languageOptions.length > 0 ? (
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <BookingWidgetField icon={MessagesSquare}>
                    <LanguageSelector
                      value={field.value}
                      onChange={field.onChange}
                      options={languageOptions}
                      placeholder="Select a language"
                      disabled={!startTimeIdValue}
                      variant="widget"
                    />
                  </BookingWidgetField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <BookingGuestsPicker
          participants={participants}
          onChange={onParticipantChange}
          quote={quote}
          disabled={!isLanguageReady}
          maxGroupSize={maxGroupSize}
        />

        <div className="pt-3">
          <BookingWidgetBreakdown
            quote={quote}
            loading={quoteLoading}
            error={quoteError}
          />
        </div>

        {belowMinParticipants ? (
          <p className="text-sm text-destructive" role="alert">
            This tour requires at least {minParticipantsRequired} participant
            {minParticipantsRequired === 1 ? "" : "s"} for the selected time.
          </p>
        ) : null}

        <BookingWidgetStepOneFooter
          canBookNow={canBookNow}
          mode="checkout"
          continuing={continuingToCheckout}
          onPrimaryAction={onContinueToCheckout}
        />
      </div>
    </>
  );
}
