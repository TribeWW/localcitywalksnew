"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const ParticipantCounter = ({
  label,
  value,
  onChange,
  min = 0,
  max = 15,
  disabled = false,
  className,
}: ParticipantCounterProps) => {
  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const isMinDisabled = value <= min || disabled;
  const isMaxDisabled = value >= max || disabled;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex-1">
        <label className="text-sm font-medium text-nightsky">{label}</label>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={isMinDisabled}
          className="h-8 w-8 rounded-full"
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="min-w-[2rem] text-center">
          <span className="text-lg font-semibold text-nightsky">{value}</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={isMaxDisabled}
          className="h-8 w-8 rounded-full"
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ParticipantCounter;
