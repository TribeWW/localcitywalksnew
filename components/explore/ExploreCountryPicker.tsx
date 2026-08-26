"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/** Catalog country option for the explore multi-select picker. */
export type ExploreCountryOption = {
  countryCode: string;
  country: string;
  /** Optional Sanity `flagIcon` asset URL for the circular flag glyph. */
  flagIconUrl?: string | null;
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
 * Circular flag glyph for a country option.
 *
 * Renders a Sanity SVG/image URL when present; otherwise a muted placeholder
 * matching the design-brief empty-flag treatment.
 *
 * @param flagIconUrl - Optional Sanity flag asset URL
 * @param country - Country display name (used only for img alt fallback context)
 */
function CountryFlagGlyph({
  flagIconUrl,
  country,
}: {
  flagIconUrl?: string | null;
  country: string;
}) {
  if (flagIconUrl) {
    return (
      // Decorative; option already has an accessible name via aria-label
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={flagIconUrl}
        alt=""
        width={18}
        height={18}
        aria-hidden
        className="size-[18px] shrink-0 rounded-full object-cover ring-1 ring-grapes/14"
        data-country={country}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="size-[18px] shrink-0 rounded-full border border-border bg-pearl-gray"
    />
  );
}

/**
 * Multi-select country picker for the explore catalog filters.
 *
 * Trigger labelled **Select country**, checkbox list with optional flags,
 * footer with selection count + Clear all, close on outside click / Escape.
 * No search field. Shared by mobile and desktop layouts.
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
  const selectedCount = selectedCountryCodes.length;
  const hasSelection = selectedCount > 0;

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
    <div ref={rootRef} className={`relative shrink-0 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        className={`mb-[-1px] flex items-center gap-2 whitespace-nowrap border-0 border-b-2 bg-transparent py-4 text-left text-sm transition-colors disabled:opacity-50 ${
          hasSelection
            ? "border-tangerine font-semibold text-grapes"
            : "border-transparent font-normal text-muted-foreground hover:text-grapes"
        }`}
      >
        <span className="truncate">Select country</span>
        <ChevronDown
          className={`size-[13px] shrink-0 text-muted-foreground transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="group"
          aria-label="Filter by country"
          className="absolute left-0 top-[calc(100%+1px)] z-40 min-w-[248px] overflow-hidden rounded-md border-[1.5px] border-border bg-white shadow-[0px_8px_16px_rgba(0,0,0,0.08)]"
        >
          {countries.map(({ countryCode, country, flagIconUrl }) => {
            const isSelected = selectedCountryCodes.includes(countryCode);
            return (
              <button
                key={`picker-${countryCode || "unknown"}`}
                type="button"
                onClick={() => onToggleCountry(countryCode)}
                role="checkbox"
                aria-checked={isSelected}
                className={`flex w-full items-center gap-2.5 px-4 py-4 text-left text-sm font-normal text-grapes transition-colors hover:bg-pearl-gray ${
                  isSelected ? "bg-pearl-gray" : "bg-white"
                }`}
                aria-label={`Country option ${country}`}
              >
                <span
                  aria-hidden
                  className={`inline-flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] transition-colors ${
                    isSelected
                      ? "border-grapes bg-grapes"
                      : "border-border bg-white"
                  }`}
                >
                  {isSelected ? (
                    <Check
                      className="size-[11px] text-white"
                      strokeWidth={3}
                      aria-hidden
                    />
                  ) : null}
                </span>
                <CountryFlagGlyph flagIconUrl={flagIconUrl} country={country} />
                <span className="whitespace-nowrap">{country}</span>
              </button>
            );
          })}

          <div className="flex items-center justify-between gap-3 border-t border-border bg-pearl-gray px-3.5 py-2.5">
            <span className="text-xs text-muted-foreground">
              {hasSelection ? `${selectedCount} selected` : "None selected"}
            </span>
            {hasSelection ? (
              <button
                type="button"
                onClick={onClear}
                className="bg-transparent p-0 text-[13px] text-muted-foreground underline underline-offset-[3px] hover:text-grapes"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
