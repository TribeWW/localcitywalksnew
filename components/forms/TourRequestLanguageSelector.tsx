"use client";

/**
 * Static language dropdown for the custom tour request form.
 */

import { cn } from "@/lib/utils";
import { buildSelectTriggerAriaLabel } from "@/lib/a11y/select-trigger-aria-label";
import { TOUR_REQUEST_LANGUAGE_OPTIONS } from "@/lib/forms/tour-request-options";
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

interface TourRequestLanguageSelectorProps {
  value?: string;
  onChange: (language: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  elevatedLayer?: boolean;
  /** Accessible name for the trigger when no visible label is associated. */
  ariaLabel?: string;
}

export default function TourRequestLanguageSelector({
  value,
  onChange,
  placeholder = "Select language",
  disabled = false,
  className,
  elevatedLayer = false,
  ariaLabel,
}: TourRequestLanguageSelectorProps) {
  const fieldLabel = ariaLabel ?? placeholder;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={buildSelectTriggerAriaLabel(fieldLabel, value)}
        className={cn(
          WIDGET_FIELD_TRIGGER_CLASS,
          WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS,
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        {...bookingStackedOverlayDataAttributes(elevatedLayer)}
        className={elevatedLayer ? BOOKING_STACKED_OVERLAY_Z_CLASS : undefined}
      >
        {TOUR_REQUEST_LANGUAGE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
