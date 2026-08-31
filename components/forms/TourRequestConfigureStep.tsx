"use client";

/**
 * Step 1 of the custom tour request form — walk configuration fields.
 */

import { Calendar, Clock, Globe, MapPin, Timer } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import BookingWidgetField from "@/components/tours/booking-widget/BookingWidgetField";
import BookingGuestsPicker from "@/components/tours/booking-widget/BookingGuestsPicker";
import type { GuestCategoryKey } from "@/components/tours/booking-widget/guest-categories";
import TourRequestLanguageSelector from "@/components/forms/TourRequestLanguageSelector";
import DatePicker from "@/components/ui/date-picker";
import DurationSelector from "@/components/ui/duration-selector";
import TimeSelector from "@/components/ui/time-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { WIDGET_FIELD_TRIGGER_CLASS, WIDGET_PRIMARY_BUTTON_CLASS } from "@/components/tours/booking-widget/widget-field-styles";
import {
  TOUR_REQUEST_DURATION_SELECT_OPTIONS,
  TOUR_REQUEST_TIME_SELECT_OPTIONS,
} from "@/lib/forms/tour-request-options";
import type { TourRequestSchema } from "@/lib/validation/forms";
import { cn } from "@/lib/utils";

type TourRequestFormValues = z.infer<typeof TourRequestSchema>;

export interface TourRequestConfigureStepProps {
  form: UseFormReturn<TourRequestFormValues>;
  lockCity: boolean;
  onNext: () => void;
  elevatedLayer?: boolean;
}

export default function TourRequestConfigureStep({
  form,
  lockCity,
  onNext,
  elevatedLayer = false,
}: TourRequestConfigureStepProps) {
  const language = form.watch("language");
  const participants = {
    adults: form.watch("adults"),
    youth: form.watch("youth"),
    children: form.watch("children"),
    infants: form.watch("infants"),
  };

  const handleParticipantChange = (key: GuestCategoryKey, value: number) => {
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="preferredDate"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={Calendar}>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a date"
                  ariaLabel="Preferred date"
                  minDate={new Date()}
                  maxDate={
                    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                  }
                  variant="widget"
                  hideLeadingIcon
                  elevatedLayer={elevatedLayer}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="preferredTime"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={Clock}>
                <TimeSelector
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select time"
                  ariaLabel="Preferred time"
                  options={TOUR_REQUEST_TIME_SELECT_OPTIONS}
                  variant="widget"
                  elevatedLayer={elevatedLayer}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tourDuration"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={Timer}>
                <DurationSelector
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select duration"
                  ariaLabel="Tour duration"
                  options={TOUR_REQUEST_DURATION_SELECT_OPTIONS}
                  variant="widget"
                  elevatedLayer={elevatedLayer}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={Globe}>
                <TourRequestLanguageSelector
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select language"
                  ariaLabel="Language"
                  elevatedLayer={elevatedLayer}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {language === "Other" ? (
        <FormField
          control={form.control}
          name="otherLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Other language</FormLabel>
              <FormControl>
                <Input
                  placeholder="Please specify your language"
                  className={WIDGET_FIELD_TRIGGER_CLASS}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <div>
        <BookingGuestsPicker
          participants={participants}
          onChange={handleParticipantChange}
          quote={null}
          showUnitHints={false}
          largeGroupNoteThreshold={15}
          categoryMinOverrides={{ adults: 1 }}
        />
        <FormField
          control={form.control}
          name="adults"
          render={() => (
            <FormItem className="sr-only">
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Additional details</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Preferred route, interests, accessibility needs, anything else we should know..."
                className={cn(
                  WIDGET_FIELD_TRIGGER_CLASS,
                  "min-h-24 resize-y leading-relaxed px-3.5",
                )}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!lockCity ? (
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <BookingWidgetField icon={MapPin}>
                  <Input
                    aria-label="City"
                    placeholder="e.g. Barcelona"
                    className={WIDGET_FIELD_TRIGGER_CLASS}
                    {...field}
                  />
                </BookingWidgetField>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <div className="pt-2">
        <Button
          type="button"
          className={WIDGET_PRIMARY_BUTTON_CLASS}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
