"use client";

/**
 * Tour-page booking widget with live Bókun pricing and availability (LOC-1048 / LOC-1063 / LOC-1056).
 *
 * Two-step UI: collapsed → configuring (date/time/language/guests/breakdown) → checkout.
 *
 * - Availabilities: month-scoped fetch via `getTourAvailabilities`
 * - Pricing: debounced `getTourBookingQuote` (400ms)
 * - Checkout: `startCheckoutHandoff` → `/checkout?h=…` (LOC-1157)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar, Clock, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getTourAvailabilities,
  getTourBookingQuote,
} from "@/lib/actions/booking-widget.actions";
import { startCheckoutHandoff } from "@/lib/actions/checkout-handoff.actions";
import { buildStartCheckoutHandoffInput } from "@/lib/booking/build-start-checkout-handoff-input";
import { tourBookingParticipantsSchema } from "@/lib/validation/tour-booking";
import {
  availabilitySlotToIsoDate,
  getMonthAvailabilityRange,
  toIsoDateString,
} from "@/lib/utils/booking-widget-dates";
import BookingWidgetShell from "@/components/tours/booking-widget/BookingWidgetShell";
import BookingWidgetFromPrice from "@/components/tours/booking-widget/BookingWidgetFromPrice";
import BookingWidgetField from "@/components/tours/booking-widget/BookingWidgetField";
import BookingGuestsPicker from "@/components/tours/booking-widget/BookingGuestsPicker";
import BookingWidgetBreakdown from "@/components/tours/booking-widget/BookingWidgetBreakdown";
import BookingWidgetCollapsed from "@/components/tours/booking-widget/BookingWidgetCollapsed";
import BookingWidgetStepOneFooter from "@/components/tours/booking-widget/BookingWidgetStepOneFooter";
import type { GuestCategoryKey } from "@/components/tours/booking-widget/guest-categories";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";
import TimeSelector from "@/components/ui/time-selector";
import LanguageSelector from "@/components/tours/LanguageSelector";
import { resolveLanguageOptionsForSlot } from "@/lib/bokun/extract-guided-languages";
import type {
  BokunAvailability,
  BokunStartTime,
  BookingWidgetBootstrap,
  BookingWidgetLanguageOption,
  BookingWidgetQuote,
} from "@/types/bokun";
import { toast } from "sonner";

/** Debounce delay before calling `getTourBookingQuote` after selection changes (ms). */
const QUOTE_DEBOUNCE_MS = 400;

/** Client-side Zod schema for the booking widget form (contact + slot fields). */
const bookingWidgetFormSchema = z.object({
  fullName: z.string().trim().min(3, {
    message: "Please enter your full name (at least 3 characters)",
  }),
  email: z.string().trim().email({
    message: "Please enter a valid email address",
  }),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true;
        const phoneRegex = /^\+?[1-9]\d{6,14}$/;
        return phoneRegex.test(value.replace(/\s/g, ""));
      },
      {
        message:
          "Please enter a valid phone number with country code (e.g., +1 234 567 8900)",
      },
    ),
  message: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.trim() === "" || value.trim().length >= 10,
      {
        message:
          "Please provide more details about your tour preferences (at least 10 characters)",
      },
    ),
  city: z.string().trim().min(1),
  adults: z.number().int().min(0).max(20),
  youth: z.number().int().min(0).max(20),
  children: z.number().int().min(0).max(20),
  infants: z.number().int().min(0).max(20),
  preferredDate: z.date().optional(),
  startTimeId: z.string().optional(),
  language: z.string().optional(),
  consent: z.boolean().refine((value) => value === true, {
    message: "You must agree to the terms to submit the form",
  }),
});

/** Inferred form values for the full booking widget (step 1 + step 2 fields). */
type BookingWidgetFormValues = z.infer<typeof bookingWidgetFormSchema>;

/**
 * Formats `BokunStartTime` as `HH:mm` for the time selector.
 *
 * @param startTime - Hour/minute from product `startTimes` or availability slot
 * @returns Zero-padded 24-hour label (e.g. `"10:30"`)
 */
function formatStartTimeLabel(startTime: BokunStartTime): string {
  const hour = String(startTime.hour).padStart(2, "0");
  const minute = String(startTime.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}

/**
 * Cache key for loaded availability months.
 *
 * @param date - Any date within the month to load
 * @returns `yyyy-MM` string used in `loadedMonthsRef`
 */
function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

/**
 * Bókun-backed booking form for the tour page `#request` card.
 *
 * Orchestrates the LOC-1063 widget UI via subcomponents in `booking-widget/`:
 * collapsed → configuring (date/time/language/guests/breakdown) → checkout handoff.
 *
 * Fetches availabilities per month and debounces live quotes from
 * `getTourBookingQuote`. On continue, builds handoff input and calls
 * `startCheckoutHandoff` (LOC-1157).
 *
 * @param props - `BookingWidgetBootstrap` from `getTourDetailById`
 */
export default function BookingWidget({
  productId,
  productTitle,
  cityName,
  startTimes,
  guidedLanguageOptions,
  fromPriceAmount,
  fromPriceCurrency,
}: BookingWidgetBootstrap) {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [availabilities, setAvailabilities] = useState<BokunAvailability[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [quote, setQuote] = useState<BookingWidgetQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  /** True while `startCheckoutHandoff` is in flight; disables Continue to checkout. */
  const [isContinuingToCheckout, setIsContinuingToCheckout] = useState(false);
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const maxDate = useMemo(
    () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    [],
  );

  const form = useForm<BookingWidgetFormValues>({
    resolver: zodResolver(bookingWidgetFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      city: cityName,
      message: "",
      phoneNumber: "",
      adults: 1,
      youth: 0,
      children: 0,
      infants: 0,
      preferredDate: undefined,
      startTimeId: undefined,
      language: undefined,
      consent: false,
    },
  });

  const preferredDate = form.watch("preferredDate");
  const startTimeIdValue = form.watch("startTimeId");
  const language = form.watch("language");
  const adults = form.watch("adults");
  const youth = form.watch("youth");
  const children = form.watch("children");
  const infants = form.watch("infants");

  const participants = useMemo(
    () => ({ adults, youth, children, infants }),
    [adults, children, infants, youth],
  );

  const mergeAvailabilities = useCallback((incoming: BokunAvailability[]) => {
    setAvailabilities((prev) => {
      const byId = new Map(prev.map((slot) => [slot.id, slot]));
      for (const slot of incoming) {
        byId.set(slot.id, slot);
      }
      return [...byId.values()];
    });
  }, []);

  const loadMonthAvailabilities = useCallback(
    async (referenceDate: Date) => {
      const key = monthKey(referenceDate);
      if (loadedMonthsRef.current.has(key)) return;

      setAvailLoading(true);
      setAvailError(null);

      const { start, end } = getMonthAvailabilityRange(referenceDate);
      try {
        const result = await getTourAvailabilities(productId, start, end);

        if (!result.success) {
          setAvailError(
            result.error ?? "Unable to load availability. Please try again.",
          );
          return;
        }

        loadedMonthsRef.current.add(key);
        mergeAvailabilities(result.data);
      } catch {
        setAvailError("Unable to load availability. Please try again.");
      } finally {
        setAvailLoading(false);
      }
    },
    [mergeAvailabilities, productId],
  );

  useEffect(() => {
    void loadMonthAvailabilities(minDate);
  }, [loadMonthAvailabilities, minDate]);

  useEffect(() => {
    if (!preferredDate) return;
    void loadMonthAvailabilities(preferredDate);
  }, [preferredDate, loadMonthAvailabilities]);

  const availableDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const slot of availabilities) {
      if (!slot.soldOut && !slot.unavailable) {
        set.add(availabilitySlotToIsoDate(slot));
      }
    }
    return set;
  }, [availabilities]);

  const slotsForSelectedDate = useMemo(() => {
    if (!preferredDate) return [];
    const iso = toIsoDateString(preferredDate);
    return availabilities.filter(
      (slot) =>
        availabilitySlotToIsoDate(slot) === iso &&
        !slot.soldOut &&
        !slot.unavailable,
    );
  }, [availabilities, preferredDate]);

  const timeOptions = useMemo(() => {
    if (slotsForSelectedDate.length === 0) return [];

    const slotIds = new Set(slotsForSelectedDate.map((s) => s.startTimeId));

    if (startTimes.length > 0) {
      return startTimes
        .filter((st) => slotIds.has(st.id))
        .map((st) => ({
          value: String(st.id),
          label: formatStartTimeLabel(st),
        }));
    }

    return slotsForSelectedDate.map((slot) => ({
      value: String(slot.startTimeId),
      label: slot.startTime ?? `Start time ${slot.startTimeId}`,
    }));
  }, [slotsForSelectedDate, startTimes]);

  const selectedSlot = useMemo(() => {
    if (!startTimeIdValue) return undefined;
    const id = Number(startTimeIdValue);
    if (!Number.isFinite(id)) return undefined;
    return slotsForSelectedDate.find((slot) => slot.startTimeId === id);
  }, [slotsForSelectedDate, startTimeIdValue]);

  const languageOptions = useMemo((): BookingWidgetLanguageOption[] => {
    if (selectedSlot?.guidedLanguages?.length) {
      return resolveLanguageOptionsForSlot(
        selectedSlot.guidedLanguages,
        guidedLanguageOptions,
      );
    }
    return guidedLanguageOptions;
  }, [guidedLanguageOptions, selectedSlot]);

  const languageCodes = useMemo(
    () => languageOptions.map((option) => option.code),
    [languageOptions],
  );

  const totalParticipants = adults + youth + children + infants;

  const minParticipantsRequired = useMemo(() => {
    if (!selectedSlot) return 1;
    return (
      selectedSlot.minParticipantsToBookNow ?? selectedSlot.minParticipants ?? 1
    );
  }, [selectedSlot]);

  const belowMinParticipants =
    selectedSlot != null && totalParticipants < minParticipantsRequired;

  useEffect(() => {
    if (timeOptions.length === 1 && startTimeIdValue !== timeOptions[0].value) {
      form.setValue("startTimeId", timeOptions[0].value);
    }
  }, [form, startTimeIdValue, timeOptions]);

  useEffect(() => {
    if (languageOptions.length === 0) {
      if (language) {
        form.setValue("language", undefined);
      }
      return;
    }

    if (language && languageCodes.includes(language)) {
      return;
    }

    form.setValue(
      "language",
      languageOptions.length === 1 ? languageOptions[0]!.code : undefined,
    );
  }, [form, language, languageCodes, languageOptions]);

  useEffect(() => {
    const startTimeId = startTimeIdValue ? Number(startTimeIdValue) : NaN;
    if (!preferredDate || !Number.isFinite(startTimeId) || startTimeId <= 0) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    const participantCheck =
      tourBookingParticipantsSchema.safeParse(participants);
    if (!participantCheck.success) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    const date = toIsoDateString(preferredDate);
    let cancelled = false;

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const result = await getTourBookingQuote({
          productId,
          date,
          startTimeId,
          participants: participantCheck.data,
          language: language?.trim() || undefined,
          currency: "EUR",
        });

        if (cancelled) return;

        if (!result.success) {
          setQuote(null);
          setQuoteError(
            result.error ?? "Unable to calculate price. Please try again.",
          );
          return;
        }

        setQuote(result.data);
      } catch {
        if (cancelled) return;
        setQuote(null);
        setQuoteError("Unable to calculate price. Please try again.");
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [language, participants, preferredDate, productId, startTimeIdValue]);

  const isDateDisabled = useCallback(
    (date: Date) => {
      const key = monthKey(date);
      if (!loadedMonthsRef.current.has(key)) {
        return false;
      }
      return !availableDateSet.has(toIsoDateString(date));
    },
    [availableDateSet],
  );

  const canBookNow =
    quote != null &&
    !quoteLoading &&
    !quoteError &&
    !availError &&
    !belowMinParticipants &&
    Boolean(startTimeIdValue) &&
    Boolean(preferredDate);

  const handleParticipantChange = (key: GuestCategoryKey, value: number) => {
    form.setValue(key, value, { shouldDirty: true, shouldValidate: true });
  };

  /**
   * Starts checkout handoff after server-side re-quote and token minting.
   *
   * Builds `StartCheckoutHandoffInput` from step-1 form state + live quote,
   * then redirects to `/checkout?h=…` on success.
   */
  async function handleContinueToCheckout() {
    if (!quote || !canBookNow || isContinuingToCheckout) {
      return;
    }

    setIsContinuingToCheckout(true);

    try {
      const payload = buildStartCheckoutHandoffInput({
        values: {
          preferredDate,
          startTimeId: startTimeIdValue,
          language,
          adults,
          youth,
          children,
          infants,
        },
        productId,
        productTitle,
        quote,
      });
      const result = await startCheckoutHandoff(payload);

      if (!result.success) {
        toast.error(
          result.error ??
            "Unable to continue to checkout. Please try again later.",
        );
        return;
      }

      window.location.assign(result.redirectUrl);
    } catch (error) {
      console.error("Booking widget checkout handoff error:", error);
      toast.error("Unable to continue to checkout. Please try again later.");
    } finally {
      setIsContinuingToCheckout(false);
    }
  }

  return (
    <BookingWidgetShell>
      <Form {...form}>
        <form className="space-y-0" onSubmit={(event) => event.preventDefault()}>
          <BookingWidgetFromPrice
            amount={fromPriceAmount}
            currency={fromPriceCurrency}
          />

          {!widgetOpen ? (
            <BookingWidgetCollapsed
              className={fromPriceAmount != null ? "mt-4" : undefined}
              onCheckAvailability={() => setWidgetOpen(true)}
            />
          ) : (
            <div className="mt-6 space-y-3">
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
                        <BookingWidgetField icon={Globe}>
                          <LanguageSelector
                            value={field.value}
                            onChange={field.onChange}
                            options={languageOptions}
                            placeholder="Select language"
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
                onChange={handleParticipantChange}
                quote={quote}
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
                  This tour requires at least {minParticipantsRequired}{" "}
                  participant
                  {minParticipantsRequired === 1 ? "" : "s"} for the selected
                  time.
                </p>
              ) : null}

              <BookingWidgetStepOneFooter
                canBookNow={canBookNow}
                mode="checkout"
                continuing={isContinuingToCheckout}
                onPrimaryAction={() => {
                  void handleContinueToCheckout();
                }}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <input type="hidden" name="productTitle" value={productTitle} />
        </form>
      </Form>
    </BookingWidgetShell>
  );
}
