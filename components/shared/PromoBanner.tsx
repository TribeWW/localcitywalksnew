"use client";

/**
 * PromoBanner — sitewide offer bar for marketing chrome (design brief).
 *
 * Copy confirmation is inline only (no Sonner toast). Dismiss writes a session
 * cookie and unmounts the bar for this visit. Marketing layout keeps the bar
 * pinned with the Navbar in a shared sticky chrome wrapper.
 */

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, XIcon } from "lucide-react";

import { buildPromoDismissDocumentCookie } from "@/lib/promo-banner/dismiss-cookie";
import {
  formatPromoCountdownDigit,
  formatPromoEndsStaticLabel,
  getPromoCountdownParts,
  type PromoCountdownParts,
} from "@/lib/promo-banner/countdown";

/** Props for the live promo bar (from {@link getActivePromoBanner}). */
export type PromoBannerProps = {
  headline: string;
  promoCode: string;
  endsAt: string;
  campaignId: string;
  /** Server clock ISO for first paint / hydration alignment. */
  initialNowIso?: string;
};

/**
 * Returns whether the user prefers reduced motion (no 1s countdown tick).
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Sitewide promotional offer bar: headline, copyable code, countdown, dismiss.
 *
 * Landmark is complementary (`aside`), not `role="banner"`.
 */
export function PromoBanner({
  headline,
  promoCode,
  endsAt,
  campaignId,
  initialNowIso,
}: PromoBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [nowMs, setNowMs] = useState(() =>
    initialNowIso ? Date.parse(initialNowIso) : Date.now(),
  );

  useEffect(() => {
    const reduced = prefersReducedMotion();
    setReducedMotion(reduced);

    const syncNow = () => {
      setNowMs(Date.now());
    };
    syncNow();

    if (reduced) {
      const endMs = Date.parse(endsAt);
      if (Number.isNaN(endMs)) {
        return;
      }
      const delayMs = Math.max(0, endMs - Date.now());
      const id = window.setTimeout(syncNow, delayMs);
      return () => window.clearTimeout(id);
    }

    const id = window.setInterval(syncNow, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  if (dismissed) {
    return null;
  }

  /**
   * Copies the promo code to the clipboard; on failure leaves UI unchanged.
   */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
    } catch {
      // Leave chip as-is; do not claim success.
    }
  }

  /**
   * Persists session dismiss and hides the bar immediately.
   */
  function handleDismiss() {
    document.cookie = buildPromoDismissDocumentCookie(campaignId);
    setDismissed(true);
  }

  const parts = getPromoCountdownParts(endsAt, nowMs);
  const copyLabel = copied ? "Code copied" : `Copy promo code ${promoCode}`;

  return (
    <aside
      aria-label="Promotional offer"
      className="relative border-b border-white/10 bg-gradient-to-br from-grapes via-[#1A2744] to-grapes px-12 py-2.5 text-white"
    >
      <button
        type="button"
        aria-label="Dismiss promotional offer"
        title="Dismiss"
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95 motion-reduce:transform-none"
      >
        <XIcon className="size-3.5" aria-hidden />
      </button>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <p className="text-base font-semibold leading-snug text-white">
            {headline}
          </p>
          <button
            type="button"
            aria-label={copyLabel}
            title={copyLabel}
            onClick={() => {
              void handleCopy();
            }}
            className="-my-2 inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95 motion-reduce:transform-none"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold tracking-widest text-grapes hover:opacity-90">
              <span className="font-mono">{promoCode}</span>
              {copied ? (
                <CheckIcon className="size-3.5" aria-hidden />
              ) : (
                <CopyIcon className="size-3.5" aria-hidden />
              )}
            </span>
          </button>
          {copied ? (
            <span role="status" className="text-xs font-medium text-white/60">
              Copied!
            </span>
          ) : null}
        </div>

        <PromoBannerDeadline
          reducedMotion={reducedMotion}
          endsAt={endsAt}
          parts={parts}
        />
      </div>
    </aside>
  );
}

/**
 * Countdown row, static reduced-motion date, or “Offer ended”.
 */
function PromoBannerDeadline({
  reducedMotion,
  endsAt,
  parts,
}: {
  reducedMotion: boolean;
  endsAt: string;
  parts: PromoCountdownParts | null;
}) {
  if (!parts) {
    return <p className="text-[10px] text-white/60">Offer ended</p>;
  }

  if (reducedMotion) {
    return (
      <p className="text-[10px] text-white/60">
        {formatPromoEndsStaticLabel(endsAt)}
      </p>
    );
  }

  const segments: Array<{ value: string; unit: string }> = [];
  if (parts.days > 0) {
    segments.push({
      value: formatPromoCountdownDigit(parts.days, false),
      unit: "d",
    });
  }
  segments.push(
    {
      value: formatPromoCountdownDigit(parts.hours, true),
      unit: "h",
    },
    {
      value: formatPromoCountdownDigit(parts.minutes, true),
      unit: "m",
    },
    {
      value: formatPromoCountdownDigit(parts.seconds, true),
      unit: "s",
    },
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="text-[12px] text-white/60">Ends in</span>
      {segments.map((segment, index) => (
        <span key={segment.unit} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-white/20" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="inline-flex min-w-[1.5rem] items-center justify-center gap-0.5 rounded-sm border border-white/20 bg-white/13 px-1 py-0.5 text-[12px] font-bold text-white">
            <span className="font-mono">{segment.value}</span>
            <span className="mx-0.5 h-3 w-px bg-black/20" aria-hidden />
            <span className="text-[10px] font-bold text-white/60 ">
              {segment.unit}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
