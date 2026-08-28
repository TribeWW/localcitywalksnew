"use client";

/**
 * Guided-language dropdown for the booking widget (LOC-1051).
 *
 * Renders Bókun `displayLanguages` labels from product `guidanceTypes` (GUIDED).
 * Slot `guidedLanguages` narrow the option list via `resolveLanguageOptionsForSlot`.
 */

import { cn } from "@/lib/utils";
import type { BookingWidgetLanguageOption } from "@/types/bokun";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS, WIDGET_FIELD_TRIGGER_CLASS } from "@/components/tours/booking-widget/widget-field-styles";
import { BOOKING_STACKED_OVERLAY_Z_CLASS, bookingStackedOverlayDataAttributes } from "@/components/tours/booking-widget/stacked-overlay-layer";

/** Props for `LanguageSelector`. */
interface LanguageSelectorProps {
  /** Selected Bókun language code. */
  value?: string;
  /** Called with the raw code when the user picks a language. */
  onChange: (language: string | undefined) => void;
  /** Guided language code + display label pairs. */
  options: BookingWidgetLanguageOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Compact bordered trigger for booking widget (LOC-1063). */
  variant?: "default" | "widget";
  /** Raises the dropdown above the mobile booking drawer (`z-[80]`). */
  elevatedLayer?: boolean;
}

/**
 * Select control for tour guided language.
 *
 * @param props.options - From `guidanceTypes` or narrowed by slot `guidedLanguages`
 */
const LanguageSelector = ({
  value,
  onChange,
  options,
  placeholder = "Select language",
  disabled = false,
  className,
  variant = "default",
  elevatedLayer = false,
}: LanguageSelectorProps) => {
  const uniqueOptions = options.filter(
    (option, index, all) =>
      option.code.trim() &&
      all.findIndex((candidate) => candidate.code === option.code) === index,
  );

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || uniqueOptions.length === 0}
    >
      <SelectTrigger
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
        {uniqueOptions.map((option) => (
          <SelectItem key={option.code} value={option.code}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
