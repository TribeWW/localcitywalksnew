"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/** Catalog country option for the explore multi-select picker. */
export type ExploreCountryOption = {
  countryCode: string;
  country: string;
};

export type ExploreCountryPickerProps = {
  /** Full catalog country list (checkbox options; no search). */
  countries: ExploreCountryOption[];
  /** Currently selected ISO2 country codes. */
  selectedCountryCodes: string[];
  /** Disables the trigger while filters/sort are loading. */
  disabled?: boolean;
  /** Optional wrapper className (layout differs on mobile vs desktop). */
  className?: string;
  /** DOM id for the dropdown panel (`aria-controls`). */
  menuId?: string;
  /** Toggle one country in the multi-select selection. */
  onToggleCountry: (countryCode: string) => void;
  /** Clear all selected countries (shown inside the open menu). */
  onClear: () => void;
};

/**
 * Multi-select country picker for the explore catalog filters.
 *
 * Trigger labelled **Country**, checkbox list, Clear inside the menu, close on
 * outside click / Escape. No search field. Shared by mobile and desktop layouts.
 *
 * @param props - Countries, selection, callbacks, and optional layout classes
 * @returns Country picker trigger + dropdown panel
 */
export default function ExploreCountryPicker({
  countries,
  selectedCountryCodes,
  disabled = false,
  className,
  menuId = "explore-country-menu",
  onToggleCountry,
  onClear,
}: ExploreCountryPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      const target = event.target as Node;
      if (!rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={menuId}
        className="flex h-10 w-full items-center gap-2 rounded-sm border-input text-[#6A6A6A] bg-white text-left text-sm disabled:opacity-50"
      >
        <span className="truncate">Select country</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#6A6A6A] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={menuId}
          className="absolute left-0 top-12 z-40 w-full rounded-sm border border-border bg-white p-2 shadow-lg"
        >
          <div className="max-h-60 overflow-y-auto">
            {countries.map(({ countryCode, country }) => {
              const isSelected = selectedCountryCodes.includes(countryCode);
              return (
                <button
                  key={`picker-${countryCode || "unknown"}`}
                  type="button"
                  onClick={() => onToggleCountry(countryCode)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
                  aria-label={`Country option ${country}`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                        isSelected
                          ? "border-[#0F172A] bg-[#0F172A]"
                          : "border-[#CBD5E1] bg-white"
                      }`}
                      aria-hidden
                    >
                      {isSelected ? (
                        <Check className="h-3 w-3 text-white" aria-hidden />
                      ) : null}
                    </span>
                    <span>{country}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {selectedCountryCodes.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="mt-2 w-full border-t border-border px-2 pt-3 pb-1 text-left text-sm font-medium text-[#6A6A6A] hover:text-[#0F172A]"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
