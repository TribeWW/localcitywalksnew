"use client";

/**
 * Promo code apply/remove control for checkout order summary (LOC-1232).
 *
 * Visual states follow the discount-code mockup (idle / invalid / applied),
 * adapted to LocalCityWalks design tokens. Validation is delegated to the
 * parent via `onValidate` so the server action can supply contact + handoff.
 */

import { useState } from "react";
import { Check, X } from "lucide-react";

import { formatCataloguePriceAmount } from "@/lib/bokun/format-catalogue-price";
import { cn } from "@/lib/utils";

import { CHECKOUT_FIELD_CLASS } from "./checkout-field-styles";

/** UI state machine for the promo input. */
export type PromoCodeStatus = "idle" | "invalid" | "pending" | "applied";

/** Successful applied promo snapshot notified to the parent. */
export interface AppliedPromoCode {
  /** Normalized promo code shown in the success chip. */
  code: string;
  /** Absolute discount in major currency units. */
  discountAmount: number;
  /** Payable total after the discount. */
  discountedAmount: number;
}

/** Result returned by the parent validation callback. */
export type PromoCodeValidateResult =
  | ({ valid: true } & AppliedPromoCode)
  | { valid: false };

export interface PromoCodeInputProps {
  /** ISO currency used to format the discount row. */
  currency: string;
  /**
   * Validates a trimmed promo code (typically via `validatePromoCode`).
   *
   * @param code - Raw user input (already trimmed by the control)
   */
  onValidate: (code: string) => Promise<PromoCodeValidateResult>;
  /**
   * Notifies the parent when a promo is applied or cleared.
   *
   * @param applied - Applied snapshot, or `null` when removed
   */
  onAppliedChange?: (applied: AppliedPromoCode | null) => void;
  /** Optional classes on the root wrapper. */
  className?: string;
}

/**
 * Renders the promo-code field, Apply CTA, invalid error, or applied chip.
 */
export function PromoCodeInput({
  currency,
  onValidate,
  onAppliedChange,
  className,
}: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<PromoCodeStatus>("idle");
  const [applied, setApplied] = useState<AppliedPromoCode | null>(null);

  const trimmedCode = code.trim();
  const hasInput = trimmedCode.length > 0;
  const isPending = status === "pending";

  /**
   * Calls parent validation and transitions to applied or invalid.
   */
  async function handleApply() {
    if (!hasInput || isPending) {
      return;
    }

    setStatus("pending");

    try {
      const result = await onValidate(trimmedCode);

      if (!result.valid) {
        setApplied(null);
        setStatus("invalid");
        return;
      }

      const nextApplied: AppliedPromoCode = {
        code: result.code.trim().toUpperCase(),
        discountAmount: result.discountAmount,
        discountedAmount: result.discountedAmount,
      };

      setApplied(nextApplied);
      setStatus("applied");
      onAppliedChange?.(nextApplied);
    } catch {
      setApplied(null);
      setStatus("invalid");
    }
  }

  /**
   * Clears the applied promo and restores the idle input.
   */
  function handleRemove() {
    setCode("");
    setApplied(null);
    setStatus("idle");
    onAppliedChange?.(null);
  }

  if (status === "applied" && applied) {
    const formattedDiscount = formatCataloguePriceAmount(
      applied.discountAmount,
      currency,
    );

    return (
      <div
        className={cn("flex items-center justify-between gap-3", className)}
        data-testid="promo-code-applied"
      >
        <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-emerald-200 bg-emerald-50 px-3 py-1">
          <Check size={12} className="shrink-0 text-emerald-700" aria-hidden />
          <span className="text-sm font-medium text-emerald-800">
            {applied.code}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="cursor-pointer border-none bg-transparent leading-none text-emerald-700 transition-opacity hover:opacity-70"
            aria-label="Remove promo code"
          >
            <X size={12} aria-hidden />
          </button>
        </div>
        <span className="text-sm font-medium text-emerald-800">
          -{formattedDiscount ?? "—"}
        </span>
      </div>
    );
  }

  const borderClass =
    status === "invalid"
      ? "border-destructive focus:border-destructive focus-visible:border-destructive active:border-destructive"
      : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Promo or gift code"
          value={code}
          disabled={isPending}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setCode(event.target.value);
            if (status === "invalid") {
              setStatus("idle");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleApply();
            }
          }}
          className={cn(CHECKOUT_FIELD_CLASS, "flex-1", borderClass)}
          aria-invalid={status === "invalid"}
          aria-describedby={
            status === "invalid" ? "promo-code-error" : undefined
          }
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={!hasInput || isPending}
          className={cn(
            "whitespace-nowrap rounded-lg border-[1.5px] px-4 py-2 text-sm font-medium outline-none transition-colors duration-150",
            hasInput && !isPending
              ? "cursor-pointer border-nightsky bg-nightsky text-white hover:bg-watermelon"
              : "cursor-not-allowed border-border bg-white text-muted-foreground opacity-40",
          )}
        >
          {isPending ? "Applying…" : "Apply"}
        </button>
      </div>
      {status === "invalid" ? (
        <p id="promo-code-error" className="m-0 text-xs text-destructive">
          This code is invalid or has expired.
        </p>
      ) : null}
    </div>
  );
}
