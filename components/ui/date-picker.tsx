"use client";

/**
 * Calendar date picker used by tour request and booking widget forms.
 *
 * Default / desktop widget: popover anchored to the trigger (`modal` on widget for Safari).
 * Touch / narrow widget: centered dialog with scroll lock.
 * Supports `isDateDisabled` for Bókun sold-out / no-slot dates (LOC-1050).
 */

import React, { useSyncExternalStore, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS,
  WIDGET_FIELD_TRIGGER_CLASS,
} from "@/components/tours/booking-widget/widget-field-styles";

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

const NARROW_WIDGET_MEDIA = "(max-width: 1023px)";
const COARSE_POINTER_MEDIA = "(pointer: coarse)";

function subscribeToWidgetDialogPreference(onStoreChange: () => void) {
  const narrow = window.matchMedia(NARROW_WIDGET_MEDIA);
  const coarse = window.matchMedia(COARSE_POINTER_MEDIA);
  const sync = () => onStoreChange();

  narrow.addEventListener("change", sync);
  coarse.addEventListener("change", sync);

  return () => {
    narrow.removeEventListener("change", sync);
    coarse.removeEventListener("change", sync);
  };
}

function getWidgetDialogPreferenceSnapshot(): boolean {
  return (
    window.matchMedia(NARROW_WIDGET_MEDIA).matches ||
    window.matchMedia(COARSE_POINTER_MEDIA).matches
  );
}

function getWidgetDialogPreferenceServerSnapshot(): boolean {
  return true;
}

/** Touch or narrow viewports use a centered dialog instead of a popover. */
function usePreferWidgetDialog(): boolean {
  return useSyncExternalStore(
    subscribeToWidgetDialogPreference,
    getWidgetDialogPreferenceSnapshot,
    getWidgetDialogPreferenceServerSnapshot,
  );
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
  const preferWidgetDialog = usePreferWidgetDialog();
  const useWidgetDialog = variant === "widget" && preferWidgetDialog;

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

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        variant === "widget"
          ? cn(
              WIDGET_FIELD_TRIGGER_CLASS,
              WIDGET_DROPDOWN_TRIGGER_LAYOUT_CLASS,
              // Button `has-[>svg]:px-3` would shrink pl-10 and overlap BookingWidgetField icon
              "has-[>svg]:pl-10 has-[>svg]:pr-3.5",
            )
          : "w-full justify-start text-left font-normal",
        !value && "text-muted-foreground",
        className,
      )}
      disabled={disabled}
    >
      {variant === "widget" ? (
        <>
          <span className="min-w-0 flex-1 truncate text-left">
            {value ? format(value, "PPP") : placeholder}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground opacity-50"
            aria-hidden
          />
        </>
      ) : (
        <>
          {!hideLeadingIcon ? (
            <CalendarIcon className="mr-2 h-4 w-4" />
          ) : null}
          {value ? format(value, "PPP") : placeholder}
        </>
      )}
    </Button>
  );

  const calendar = (
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
      className={cn(
        variant === "widget" &&
          "w-full [--cell-size:max(2rem,calc((100%_-_0.25rem)_/_7))]",
      )}
    />
  );

  if (useWidgetDialog) {
    return (
      <div className="w-full">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="w-[calc(100%-2rem)] max-w-sm gap-0 border-border bg-popover p-0 shadow-lg sm:max-w-sm"
          >
            <DialogTitle className="sr-only">Select a date</DialogTitle>
            <div className="w-full p-2">{calendar}</div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Popover
        open={open}
        onOpenChange={handleOpenChange}
        modal={variant === "widget"}
      >
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={12}
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-0",
            variant === "widget" && "overflow-hidden",
          )}
        >
          <div
            className={cn(
              variant === "widget"
                ? "w-full p-2"
                : "flex justify-center p-3",
            )}
          >
            {calendar}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
