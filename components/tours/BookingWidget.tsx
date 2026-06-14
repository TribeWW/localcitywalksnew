"use client";

/**
 * Tour-page booking widget with live Bókun pricing and availability (LOC-1048).
 *
 * Client UI rendered when `cards-widget-update` is enabled. Receives server-passed
 * `BookingWidgetBootstrap` from `getTourDetailById`; calls server actions for:
 *
 * - `getTourAvailabilities` — month-scoped calendar / slot data
 * - `getTourBookingQuote` — debounced (400ms) total on participant / date / time changes
 *
 * Replaces legacy `TourRequestForm` static time/duration options with dynamic
 * `startTimes` ∩ availabilities, read-only `durationText`, and four participant counters.
 * Submit wiring lands in LOC-1056 (`submitTourBookingRequest`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getTourAvailabilities,
  getTourBookingQuote,
} from "@/lib/actions/booking-widget.actions";
import { tourBookingParticipantsSchema } from "@/lib/validation/tour-booking";
import {
  availabilitySlotToIsoDate,
  getMonthAvailabilityRange,
  toIsoDateString,
} from "@/lib/utils/booking-widget-dates";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ParticipantCounter from "@/components/ui/participant-counter";
import DatePicker from "@/components/ui/date-picker";
import TimeSelector from "@/components/ui/time-selector";
import LanguageSelector from "@/components/tours/LanguageSelector";
import BookingPriceSummary from "@/components/tours/BookingPriceSummary";
import type {
  BokunAvailability,
  BokunStartTime,
  BookingWidgetBootstrap,
  BookingWidgetQuote,
} from "@/types/bokun";
import { toast } from "sonner";

const QUOTE_DEBOUNCE_MS = 400;

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

type BookingWidgetFormValues = z.infer<typeof bookingWidgetFormSchema>;

function formatStartTimeLabel(startTime: BokunStartTime): string {
  const hour = String(startTime.hour).padStart(2, "0");
  const minute = String(startTime.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}

function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

/**
 * Bókun-backed booking form for the tour page `#request` card.
 *
 * @param props - `BookingWidgetBootstrap` from `getTourDetailById` (product id, times, languages, duration)
 */
export default function BookingWidget({
  productId,
  productTitle,
  cityName,
  startTimes,
  languages,
  durationText,
}: BookingWidgetBootstrap) {
  const [availabilities, setAvailabilities] = useState<BokunAvailability[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [quote, setQuote] = useState<BookingWidgetQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
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
  const consent = form.watch("consent");

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

  const languageOptions = useMemo(() => {
    if (selectedSlot?.guidedLanguages?.length) {
      return selectedSlot.guidedLanguages;
    }
    return languages;
  }, [languages, selectedSlot]);

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

    if (language && languageOptions.includes(language)) {
      return;
    }

    form.setValue(
      "language",
      languageOptions.length === 1 ? languageOptions[0] : undefined,
    );
  }, [form, language, languageOptions]);

  useEffect(() => {
    const startTimeId = startTimeIdValue ? Number(startTimeIdValue) : NaN;
    if (!preferredDate || !Number.isFinite(startTimeId) || startTimeId <= 0) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    const participants = { adults, youth, children, infants };
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
  }, [
    adults,
    children,
    infants,
    language,
    preferredDate,
    productId,
    startTimeIdValue,
    youth,
  ]);

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

  const canSubmit =
    consent &&
    quote != null &&
    !quoteLoading &&
    !quoteError &&
    !availError &&
    !belowMinParticipants &&
    Boolean(startTimeIdValue) &&
    Boolean(preferredDate);

  async function onSubmit(_values: BookingWidgetFormValues) {
    toast.error(
      "Booking request submission is not available yet. Pricing and availability are live — email submission ships in the next release.",
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-nightsky">Participants</h3>

          <FormField
            control={form.control}
            name="adults"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ParticipantCounter
                    label="Adults (18+)"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youth"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ParticipantCounter
                    label="Youth (13-17)"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="children"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ParticipantCounter
                    label="Children (3-12)"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="infants"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ParticipantCounter
                    label="Infants (0-2)"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-nightsky">Tour schedule</h3>

          {durationText ? (
            <p className="text-sm text-muted-foreground">
              Duration: <span className="text-nightsky">{durationText}</span>
            </p>
          ) : null}

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
                <FormLabel className="text-sm font-medium text-nightsky">
                  Preferred date
                </FormLabel>
                <FormControl>
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
                  />
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
                <FormLabel className="text-sm font-medium text-nightsky">
                  Start time
                </FormLabel>
                <FormControl>
                  <TimeSelector
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select time"
                    options={timeOptions}
                    disabled={!preferredDate || timeOptions.length === 0}
                  />
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
                  <FormLabel className="text-sm font-medium text-nightsky">
                    Tour language
                  </FormLabel>
                  <FormControl>
                    <LanguageSelector
                      value={field.value}
                      onChange={field.onChange}
                      languages={languageOptions}
                      placeholder="Select language"
                      disabled={!startTimeIdValue}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <BookingPriceSummary
          quote={quote}
          loading={quoteLoading}
          error={quoteError}
          showBreakdown
        />

        {belowMinParticipants ? (
          <p className="text-sm text-destructive" role="alert">
            This tour requires at least {minParticipantsRequired} participant
            {minParticipantsRequired === 1 ? "" : "s"} for the selected time.
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Full name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Phone number (optional)
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+1 234 567 8900 (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Message (optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Tell us about your tour preferences."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="bg-white"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-nightsky">
                  I agree that LocalCityWalks may use my details to respond to
                  my tour request.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <input type="hidden" name="productTitle" value={productTitle} />

        <div className="my-6">
          <Button
            type="submit"
            className="w-full bg-nightsky hover:bg-nightsky/80"
            disabled={!canSubmit}
          >
            Send request
          </Button>
        </div>
      </form>
    </Form>
  );
}
