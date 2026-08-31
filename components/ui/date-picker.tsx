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
import {
  BOOKING_STACKED_OVERLAY_Z_CLASS,
  bookingStackedOverlayDataAttributes,
} from "@/components/tours/booking-widget/stacked-overlay-layer";

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
  /**
   * When true, raises the touch dialog above the mobile booking drawer (`z-[80]`).
   * Use inside `BookingWidgetMobileDrawer` only.
   */
  elevatedLayer?: boolean;
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
  elevatedLayer = false,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => resolveVisibleMonth(value, minDate));
  const preferWidgetDialog = usePreferWidgetDialog();
  // Touch/narrow viewports, and any elevated layer (e.g. tour-request modal), use the
  // centered dialog — avoids popover height clipping against the form below.
  const useWidgetDialog =
    variant === "widget" && (preferWidgetDialog || elevatedLayer);

  // Native month/year <select> menus misbehave on touch (iOS shows the picker
  // persistently). Use prev/next navigation in the centered widget dialog instead.
  const useDropdownCaption = Boolean(minDate && maxDate) && !useWidgetDialog;

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
          : "w-full justify-start text-left text-base font-normal",
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
          {!hideLeadingIcon ? <CalendarIcon className="mr-2 h-4 w-4" /> : null}
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
          (useWidgetDialog
            ? "w-full p-1 [--cell-size:min(2rem,calc((100%_-_1rem)_/_7))]"
            : "w-full p-0 [--cell-size:max(2rem,calc((100%_-_0.25rem)_/_7))]"),
      )}
    />
  );

  if (useWidgetDialog) {
    const widgetDialogOverlayClass = cn(
      elevatedLayer && BOOKING_STACKED_OVERLAY_Z_CLASS,
      elevatedLayer && "!top-14",
    );

    const widgetDialogContentClass = cn(
      "w-[calc(100%-3rem)] max-w-sm max-h-[min(36rem,calc(100vh-4rem))] gap-0 overflow-y-auto rounded-2xl border border-border bg-white p-0 shadow-2xl sm:max-w-sm",
      elevatedLayer
        ? cn(
            BOOKING_STACKED_OVERLAY_Z_CLASS,
            "!top-[calc(4.75rem+1.25rem)] !bottom-auto !max-h-[min(36rem,calc(100vh-6rem))] !translate-y-0",
          )
        : undefined,
    );

    return (
      <div className="w-full">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
          <DialogContent
            showCloseButton={false}
            {...bookingStackedOverlayDataAttributes(elevatedLayer)}
            overlayClassName={widgetDialogOverlayClass}
            className={widgetDialogContentClass}
          >
            <DialogTitle className="border-b border-border px-5 py-4 text-center text-base font-semibold text-nightsky">
              Select a date
            </DialogTitle>
            <div className="px-5 pb-6 pt-4">
              <div className="min-h-[22rem] rounded-xl bg-background px-4 pb-5 pt-3">
                {calendar}
              </div>
            </div>
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
          {...bookingStackedOverlayDataAttributes(elevatedLayer)}
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-3",
            elevatedLayer && BOOKING_STACKED_OVERLAY_Z_CLASS,
          )}
        >
          {calendar}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
