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

interface DurationSelectorProps {
  value?: string;
  onChange: (duration: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const DURATION_OPTIONS = [
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
}: DurationSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {DURATION_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DurationSelector;
