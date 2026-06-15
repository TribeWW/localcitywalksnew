"use client";

/**
 * Calendar date picker used by tour request and booking widget forms.
 *
 * Supports `isDateDisabled` for Bókun sold-out / no-slot dates (LOC-1050).
 */

import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

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
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className
        )}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP") : placeholder}
      </Button>

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[60] bg-black/10 bg-opacity-20"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white border border-gray-200 rounded-md shadow-lg p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (isDateDisabled?.(date)) return true;
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              initialFocus
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
