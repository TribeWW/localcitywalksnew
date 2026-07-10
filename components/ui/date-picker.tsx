"use client";

/**
 * Calendar date picker used by tour request and booking widget forms.
 *
 * Opens a popover anchored to the trigger (not a centered modal).
 * Supports `isDateDisabled` for Bókun sold-out / no-slot dates (LOC-1050).
 */

import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
 * Measures the painted height of calendar content inside the popover panel.
 * iOS Safari can under-report flex/aspect-ratio layout height; descendant
 * bounds reflect what users actually see.
 */
function measureWidgetPopoverPanelHeight(container: HTMLElement): number {
  const containerTop = container.getBoundingClientRect().top;
  let maxBottom = containerTop;

  const calendar = container.querySelector("[data-slot='calendar']");
  if (!calendar) {
    return Math.ceil(container.getBoundingClientRect().height);
  }

  maxBottom = Math.max(maxBottom, calendar.getBoundingClientRect().bottom);

  calendar.querySelectorAll("*").forEach((node) => {
    if (node instanceof HTMLElement) {
      maxBottom = Math.max(maxBottom, node.getBoundingClientRect().bottom);
    }
  });

  return Math.ceil(maxBottom - containerTop);
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
  const widgetPanelRef = useRef<HTMLDivElement>(null);
  const [widgetPanelHeight, setWidgetPanelHeight] = useState<number | undefined>();

  const useDropdownCaption = Boolean(minDate && maxDate);

  useEffect(() => {
    if (!open || variant !== "widget" || !widgetPanelRef.current) {
      setWidgetPanelHeight(undefined);
      return;
    }

    const panel = widgetPanelRef.current;

    const syncPanelHeight = () => {
      setWidgetPanelHeight(measureWidgetPopoverPanelHeight(panel));
    };

    syncPanelHeight();
    const rafId = requestAnimationFrame(syncPanelHeight);

    const observer = new ResizeObserver(syncPanelHeight);
    observer.observe(panel);

    const calendar = panel.querySelector("[data-slot='calendar']");
    if (calendar) {
      observer.observe(calendar);
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [open, variant, month]);

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
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={12}
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-0",
            variant === "widget" &&
              "h-auto overflow-y-auto bg-popover data-[state=closed]:animate-none data-[state=open]:animate-none max-h-[var(--radix-popover-content-available-height)]",
          )}
        >
          <div
            ref={variant === "widget" ? widgetPanelRef : undefined}
            style={
              variant === "widget" && widgetPanelHeight != null
                ? { minHeight: widgetPanelHeight }
                : undefined
            }
            className={cn(
              variant === "widget"
                ? "w-full rounded-md bg-popover p-2"
                : "flex justify-center p-3",
            )}
          >
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
              classNames={variant === "widget" ? { root: "w-full" } : undefined}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
