"use client";

/**
 * Step 2 of the booking widget — contact details and submit (LOC-1063).
 *
 * Collects name, email, optional phone/message, shows a price recap without
 * the empty prompt, requires consent, and exposes a `type="submit"` button.
 * Must be rendered inside the parent `<Form>` from `BookingWidget`.
 *
 * Submit wiring (`submitTourBookingRequest`) lands in LOC-1056.
 */

import type { Control, FieldValues } from "react-hook-form";
import { Mail, MessageSquare, Phone, User } from "lucide-react";
import BookingWidgetField from "@/components/tours/booking-widget/BookingWidgetField";
import BookingWidgetBreakdown from "@/components/tours/booking-widget/BookingWidgetBreakdown";
import { WIDGET_FIELD_TRIGGER_CLASS, WIDGET_PRIMARY_BUTTON_CLASS } from "@/components/tours/booking-widget/widget-field-styles";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookingWidgetQuote } from "@/types/bokun";

/**
 * Contact-step field subset registered on the parent booking widget form.
 * Exported for test harnesses and future submit action typing.
 */
export interface BookingWidgetContactFormValues {
  fullName: string;
  email: string;
  phoneNumber?: string;
  message?: string;
  consent: boolean;
}

/** Props for `BookingWidgetContactStep`. */
interface BookingWidgetContactStepProps {
  /**
   * react-hook-form control from the parent `BookingWidget` form.
   * Cast from the full form control because the parent schema includes step-1 fields.
   */
  control: Control<FieldValues>;
  /** Quote carried over from step 1 for the recap breakdown. */
  quote: BookingWidgetQuote | null;
  /** True while a background quote refresh is in flight. */
  quoteLoading: boolean;
  /** Quote error surfaced in the recap region. */
  quoteError: string | null;
  /** When true, enables “Send request” (valid contact fields + consent). */
  canSubmit: boolean;
  /** Returns the user to step 1 (`"configuring"`). */
  onBack: () => void;
}

/**
 * Renders step-2 contact fields, price recap, consent checkbox, and submit button.
 *
 * @param props.control - Parent form control; field names must match `BookingWidgetContactFormValues`
 * @param props.canSubmit - Parent-derived gate from Zod validation and consent
 * @param props.onBack - Resets widget step without clearing form values
 */
export default function BookingWidgetContactStep({
  control,
  quote,
  quoteLoading,
  quoteError,
  canSubmit,
  onBack,
}: BookingWidgetContactStepProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-muted-foreground hover:text-nightsky"
      >
        ← Back to booking details
      </button>

      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={User}>
                <Input
                  placeholder="Full name"
                  className={WIDGET_FIELD_TRIGGER_CLASS}
                  {...field}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={Mail}>
                <Input
                  type="email"
                  placeholder="Email"
                  className={WIDGET_FIELD_TRIGGER_CLASS}
                  {...field}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={Phone}>
                <Input
                  type="tel"
                  placeholder="Phone number (optional)"
                  className={WIDGET_FIELD_TRIGGER_CLASS}
                  {...field}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BookingWidgetField icon={MessageSquare}>
                <Textarea
                  rows={3}
                  placeholder="Message (optional)"
                  className={cn(
                    WIDGET_FIELD_TRIGGER_CLASS,
                    "min-h-[88px] resize-none",
                  )}
                  {...field}
                />
              </BookingWidgetField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pt-2">
        <BookingWidgetBreakdown
          quote={quote}
          loading={quoteLoading}
          error={quoteError}
          showEmptyPrompt={false}
        />
      </div>

      <FormField
        control={control}
        name="consent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3 space-y-0 pt-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-0.5 bg-white"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-sm font-normal text-nightsky">
                I agree that LocalCityWalks may use my details to respond to my
                tour request.
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <Button
        type="submit"
        className={WIDGET_PRIMARY_BUTTON_CLASS}
        disabled={!canSubmit}
      >
        Send request
      </Button>
    </div>
  );
}
