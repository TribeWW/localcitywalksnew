"use client";

/**
 * Guests accordion with per-category steppers (LOC-1063).
 *
 * Collapsed trigger shows total participant count. Expanded panel lists four
 * categories with age range, live unit-price hints from the quote, and −/+ controls.
 */

import { useEffect, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { sumBookingWidgetParticipants } from "@/lib/booking/max-group-size-message";
import {
  GUEST_CATEGORIES,
  formatGuestUnitHint,
  type GuestCategoryKey,
} from "@/components/tours/booking-widget/guest-categories";
import {
  WIDGET_FIELD_DISABLED_CLASS,
  WIDGET_GUESTS_TRIGGER_CLASS,
} from "@/components/tours/booking-widget/widget-field-styles";
import type {
  BookingWidgetParticipants,
  BookingWidgetQuote,
} from "@/types/bokun";

/** Props for `BookingGuestsPicker`. */
interface BookingGuestsPickerProps {
  /** Current participant counts keyed by category. */
  participants: BookingWidgetParticipants;
  /**
   * Called when a stepper changes a category count.
   * Parent should update form state and trigger quote refresh.
   */
  onChange: (key: GuestCategoryKey, value: number) => void;
  /** Latest quote for per-category unit hints; `null` before first quote. */
  quote: BookingWidgetQuote | null;
  /** When true, the accordion trigger and steppers are not interactive. */
  disabled?: boolean;
  /** Bókun `maxPerBooking` for the selected slot; caps total group size when set. */
  maxGroupSize?: number | null;
  /** When false, hides per-category unit price hints (tour request form). */
  showUnitHints?: boolean;
  /** When set, shows a large-group note when total exceeds this threshold. */
  largeGroupNoteThreshold?: number | null;
  /** Optional per-category minimum overrides (e.g. adults min 1 for tour requests). */
  categoryMinOverrides?: Partial<Record<GuestCategoryKey, number>>;
}

/**
 * Max count allowed for one category given total group cap and other selections.
 */
function resolveCategoryStepperMax(
  key: GuestCategoryKey,
  participants: BookingWidgetParticipants,
  categoryMin: number,
  categoryMax: number,
  maxGroupSize: number | null | undefined,
): number {
  if (maxGroupSize == null) {
    return categoryMax;
  }

  const othersTotal =
    sumBookingWidgetParticipants(participants) - participants[key];
  const remaining = maxGroupSize - othersTotal;

  return Math.max(categoryMin, Math.min(categoryMax, remaining));
}

/**
 * Accordion guest picker with bounded steppers per `GUEST_CATEGORIES` entry.
 *
 * Stepper clicks clamp to each category's `min` / `max`. Decrease is disabled
 * at minimum; increase is disabled at maximum.
 *
 * @param props.participants - Controlled counts from react-hook-form
 * @param props.onChange - Emits the category key and new absolute count
 * @param props.quote - Optional live quote for unit price hints under each label
 */
export default function BookingGuestsPicker({
  participants,
  onChange,
  quote,
  disabled = false,
  maxGroupSize = null,
  showUnitHints = true,
  largeGroupNoteThreshold = null,
  categoryMinOverrides,
}: BookingGuestsPickerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const totalGuests = sumBookingWidgetParticipants(participants);

  /** Applies a delta to one category, clamped to configured min/max. */
  const updateCount = (key: GuestCategoryKey, delta: number) => {
    if (disabled) return;

    const config = GUEST_CATEGORIES.find((c) => c.key === key)!;
    const categoryMin = categoryMinOverrides?.[key] ?? config.min;
    const current = participants[key];
    const stepperMax = resolveCategoryStepperMax(
      key,
      participants,
      categoryMin,
      config.max,
      maxGroupSize,
    );
    const next = Math.max(categoryMin, Math.min(stepperMax, current + delta));
    onChange(key, next);
  };

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        aria-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        className={cn(
          WIDGET_GUESTS_TRIGGER_CLASS,
          open ? "rounded-t-lg rounded-b-none" : "rounded-lg",
          disabled ? WIDGET_FIELD_DISABLED_CLASS : "cursor-pointer",
        )}
      >
        <span className="flex items-center gap-2">
          <Users
            className={cn(
              "h-[18px] w-[18px]",
              disabled ? "text-current" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <span>
            {totalGuests} {totalGuests === 1 ? "participant" : "participants"}
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={cn(
            "transition-transform text-muted-foreground opacity-50",
            open && "rotate-180",
          )}
          aria-hidden
        >
          <path
            d="M3 5L7 9L11 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !disabled ? (
        <div className="overflow-hidden rounded-b-lg border-2 border-t-0 border-foreground">
          {GUEST_CATEGORIES.map((category, index) => {
            const count = participants[category.key];
            const categoryMin = categoryMinOverrides?.[category.key] ?? category.min;
            const unitHint = formatGuestUnitHint(category.label, quote);
            const stepperMax = resolveCategoryStepperMax(
              category.key,
              participants,
              categoryMin,
              category.max,
              maxGroupSize,
            );

            return (
              <div
                key={category.key}
                className={cn(
                  "flex items-center justify-between px-3.5 py-3",
                  index > 0 && "border-t border-border/40",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-nightsky">
                    {category.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {showUnitHints
                      ? `${category.ageRange} · ${unitHint}`
                      : category.ageRange}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Decrease ${category.label}`}
                    disabled={disabled || count <= categoryMin}
                    onClick={() => updateCount(category.key, -1)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-border bg-white",
                      disabled || count <= categoryMin
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer",
                    )}
                  >
                    <Minus className="h-3.5 w-3.5 text-nightsky" />
                  </button>
                  <span className="min-w-4 text-center text-sm font-semibold text-nightsky">
                    {count}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${category.label}`}
                    disabled={disabled || count >= stepperMax}
                    onClick={() => updateCount(category.key, 1)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-border bg-white",
                      disabled || count >= stepperMax
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer",
                    )}
                  >
                    <Plus className="h-3.5 w-3.5 text-nightsky" />
                  </button>
                </div>
              </div>
            );
          })}
          {largeGroupNoteThreshold != null &&
          totalGuests > largeGroupNoteThreshold ? (
            <div className="border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              Large group requests are handled personally by our team.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
