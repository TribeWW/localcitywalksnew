"use client";

/**
 * Time-of-day select for tour request and booking widget flows.
 *
 * Accepts dynamic `options` from Bókun `startTimes` / availabilities (LOC-1048).
 * Falls back to a static legacy list when `options` is omitted (`TourRequestForm`).
 * Disabled when `options` is an empty array (aligned with `LanguageSelector`).
 */

import React from "react";
import { cn } from "@/lib/utils";
import { buildSelectTriggerAriaLabel } from "@/lib/a11y/select-trigger-aria-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS, WIDGET_FIELD_TRIGGER_CLASS } from "@/components/tours/booking-widget/widget-field-styles";
import { BOOKING_STACKED_OVERLAY_Z_CLASS, bookingStackedOverlayDataAttributes } from "@/components/tours/booking-widget/stacked-overlay-layer";

/** Props for `TimeSelector`. */
interface TimeSelectorProps {
  /** Selected option `value` (Bókun `startTimeId` string in the widget). */
  value?: string;
  /** Called with the chosen option `value`, or `undefined` when cleared. */
  onChange: (time: string | undefined) => void;
  placeholder?: string;
  /** When true, or when `options` is empty, the control is non-interactive. */
  disabled?: boolean;
  /** Dynamic options from product `startTimes` / availabilities; falls back to legacy static list when omitted. */
  options?: { value: string; label: string }[];
  className?: string;
  /** Compact bordered trigger for booking widget (LOC-1063). */
  variant?: "default" | "widget";
  /** Raises the dropdown above the mobile booking drawer (`z-[80]`). */
  elevatedLayer?: boolean;
  /** Accessible name for the trigger when no visible label is associated. */
  ariaLabel?: string;
}

/** Legacy static times for `TourRequestForm` when `options` is not passed. */
const TIME_OPTIONS = [
  { value: "09:00", label: "09:00 (9:00 AM)" },
  { value: "10:00", label: "10:00 (10:00 AM)" },
  { value: "11:00", label: "11:00 (11:00 AM)" },
  { value: "12:00", label: "12:00 (12:00 PM)" },
  { value: "13:00", label: "13:00 (1:00 PM)" },
  { value: "14:00", label: "14:00 (2:00 PM)" },
  { value: "15:00", label: "15:00 (3:00 PM)" },
  { value: "16:00", label: "16:00 (4:00 PM)" },
  { value: "17:00", label: "17:00 (5:00 PM)" },
];

/**
 * Dropdown for preferred / available start times.
 *
 * @param props.value - Option `value` to display as selected
 * @param props.onChange - Called with the chosen option `value`
 * @param props.options - Slot-driven list; omit for legacy static times
 */
const TimeSelector = ({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  options,
  className,
  variant = "default",
  elevatedLayer = false,
  ariaLabel,
}: TimeSelectorProps) => {
  const timeOptions = options ?? TIME_OPTIONS;
  const fieldLabel = ariaLabel ?? placeholder;
  const selectedLabel = timeOptions.find((option) => option.value === value)
    ?.label;

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || timeOptions.length === 0}
    >
      <SelectTrigger
        aria-label={buildSelectTriggerAriaLabel(fieldLabel, selectedLabel)}
        className={cn(
          variant === "widget"
            ? cn(WIDGET_FIELD_TRIGGER_CLASS, WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS)
            : "w-full",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        {...bookingStackedOverlayDataAttributes(elevatedLayer)}
        className={elevatedLayer ? BOOKING_STACKED_OVERLAY_Z_CLASS : undefined}
      >
        {timeOptions.length === 0 ? (
          <SelectItem value="__none__" disabled>
            No times available
          </SelectItem>
        ) : (
          timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default TimeSelector;
