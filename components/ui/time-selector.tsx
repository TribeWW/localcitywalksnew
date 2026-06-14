"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeSelectorProps {
  value?: string;
  onChange: (time: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Dynamic options from product `startTimes` / availabilities; falls back to legacy static list when omitted. */
  options?: { value: string; label: string }[];
  className?: string;
}

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

const TimeSelector = ({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  options,
  className,
}: TimeSelectorProps) => {
  const timeOptions = options ?? TIME_OPTIONS;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
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
