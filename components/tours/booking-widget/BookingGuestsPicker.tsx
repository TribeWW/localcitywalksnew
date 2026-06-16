"use client";

/**
 * Guests accordion with per-category steppers (LOC-1063).
 *
 * Collapsed trigger shows total participant count. Expanded panel lists four
 * categories with age range, live unit-price hints from the quote, and −/+ controls.
 */

import { useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GUEST_CATEGORIES,
  formatGuestUnitHint,
  type GuestCategoryKey,
} from "@/components/tours/booking-widget/guest-categories";
import type { BookingWidgetParticipants, BookingWidgetQuote } from "@/types/bokun";

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
}: BookingGuestsPickerProps) {
  const [open, setOpen] = useState(false);
  const totalGuests =
    participants.adults +
    participants.youth +
    participants.children +
    participants.infants;

  /** Applies a delta to one category, clamped to configured min/max. */
  const updateCount = (key: GuestCategoryKey, delta: number) => {
    const config = GUEST_CATEGORIES.find((c) => c.key === key)!;
    const current = participants[key];
    const next = Math.max(config.min, Math.min(config.max, current + delta));
    onChange(key, next);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between border-[1.5px] border-border bg-white px-3.5 py-2.5 text-base text-foreground transition-[border-radius]",
          open ? "rounded-t-lg rounded-b-none" : "rounded-lg",
        )}
      >
        <span className="flex items-center gap-2">
          <Users className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
          <span>
            {totalGuests} {totalGuests === 1 ? "participant" : "participants"}
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={cn("transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path
            d="M3 5L7 9L11 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          />
        </svg>
      </button>

      {open ? (
        <div className="overflow-hidden rounded-b-lg border border-t-0 border-border">
          {GUEST_CATEGORIES.map((category, index) => {
            const count = participants[category.key];
            const unitHint = formatGuestUnitHint(category.label, quote);

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
                    {category.ageRange} · {unitHint}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Decrease ${category.label}`}
                    disabled={count <= category.min}
                    onClick={() => updateCount(category.key, -1)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-border bg-white",
                      count <= category.min
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
                    disabled={count >= category.max}
                    onClick={() => updateCount(category.key, 1)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-border bg-white",
                      count >= category.max
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
        </div>
      ) : null}
    </div>
  );
}
