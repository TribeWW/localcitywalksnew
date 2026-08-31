"use client";

/**
 * Tour duration select for tour request and booking flows.
 *
 * Accepts dynamic `options`; falls back to legacy static list when omitted.
 */

import React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS,
  WIDGET_FIELD_TRIGGER_CLASS,
} from "@/components/tours/booking-widget/widget-field-styles";
import {
  BOOKING_STACKED_OVERLAY_Z_CLASS,
  bookingStackedOverlayDataAttributes,
} from "@/components/tours/booking-widget/stacked-overlay-layer";

interface DurationSelectorProps {
  value?: string;
  onChange: (duration: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  options?: { value: string; label: string }[];
  variant?: "default" | "widget";
  elevatedLayer?: boolean;
}

const LEGACY_DURATION_OPTIONS = [
  { value: "1 hour", label: "1 hour" },
  { value: "90 minutes", label: "90 minutes" },
  { value: "2 hours", label: "2 hours" },
  { value: "3 hours", label: "3 hours" },
  { value: "4 hours", label: "4 hours" },
  { value: "5 hours", label: "5 hours" },
];

const DurationSelector = ({
  value,
  onChange,
  placeholder = "Select duration",
  disabled = false,
  className,
  options,
  variant = "default",
  elevatedLayer = false,
}: DurationSelectorProps) => {
  const durationOptions = options ?? LEGACY_DURATION_OPTIONS;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          variant === "widget"
            ? cn(
                WIDGET_FIELD_TRIGGER_CLASS,
                WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS,
              )
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
        {durationOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DurationSelector;
