"use client";

/**
 * Calendar date picker used by tour request and booking widget forms.
 *
 * Opens a popover anchored to the trigger (not a centered modal).
 * Supports `isDateDisabled` for Bókun sold-out / no-slot dates (LOC-1050).
 */

import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WIDGET_FIELD_TRIGGER_CLASS } from "@/components/tours/booking-widget/widget-field-styles";

/** Props for `DatePicker`. */
interface DatePickerProps {
  value?: Date;
  /** Called when the user selects or clears a date. */
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Earliest selectable day (inclusive). */
  minDate?: Date;
  /** Latest selectable day (inclusive). */
  maxDate?: Date;
  /** When true, the date cannot be selected (e.g. sold-out / no slots). */
  isDateDisabled?: (date: Date) => boolean;
  className?: string;
  /** Widget chrome: icon provided by `BookingWidgetField`, compact bordered trigger. */
  variant?: "default" | "widget";
  hideLeadingIcon?: boolean;
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function resolveVisibleMonth(
  value: Date | undefined,
  minDate: Date | undefined,
): Date {
  if (value) return startOfDay(value);
  if (minDate) return startOfDay(minDate);
  return startOfDay(new Date());
}

/**
 * Button-triggered single-date calendar picker.
 *
 * @param props.isDateDisabled - Optional predicate; used by `BookingWidget` for unavailable days
 */
const DatePicker = ({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  isDateDisabled,
  className,
  variant = "default",
  hideLeadingIcon = false,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => resolveVisibleMonth(value, minDate));

  const useDropdownCaption = Boolean(minDate && maxDate);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setMonth(resolveVisibleMonth(value, minDate));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) {
      setMonth(startOfDay(date));
    }
    setOpen(false);
  };

  const isDayDisabled = (date: Date) => {
    if (isDateDisabled?.(date)) return true;

    const day = startOfDay(date);
    if (minDate && day < startOfDay(minDate)) return true;
    if (maxDate && day > startOfDay(maxDate)) return true;
    return false;
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              variant === "widget"
                ? WIDGET_FIELD_TRIGGER_CLASS
                : "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
          >
            {!hideLeadingIcon ? (
              <CalendarIcon className="mr-2 h-4 w-4" />
            ) : null}
            {value ? format(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={12}
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <div className="flex justify-center p-3">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={setMonth}
              captionLayout={useDropdownCaption ? "dropdown" : "label"}
              startMonth={minDate ? startOfDay(minDate) : undefined}
              endMonth={maxDate ? startOfDay(maxDate) : undefined}
              disabled={isDayDisabled}
              showOutsideDays={false}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
