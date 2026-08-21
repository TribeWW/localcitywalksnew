/**
 * PromoBanner — copy, dismiss, and a11y interaction tests (design brief).
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PromoBanner, MAX_SET_TIMEOUT_MS } from "./PromoBanner";
import { buildPromoDismissDocumentCookie } from "@/lib/promo-banner/dismiss-cookie";

const PROPS = {
  headline: "Save 20% this week",
  promoCode: "SUMMER20",
  endsAt: "2026-08-31T00:00:00.000Z",
  campaignId: "2026-08-01T00:00:00.000Z|2026-08-31T00:00:00.000Z|SUMMER20",
  initialNowIso: "2026-08-15T12:00:00.000Z",
};

function stubReducedMotion() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe("PromoBanner", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    document.cookie = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes a complementary landmark and named copy/dismiss controls", () => {
    render(<PromoBanner {...PROPS} />);

    expect(
      screen.getByRole("complementary", { name: "Promotional offer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy promo code SUMMER20" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dismiss promotional offer" }),
    ).toBeInTheDocument();
  });

  it("copies the code and shows inline Copied! confirmation", async () => {
    render(<PromoBanner {...PROPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Copy promo code SUMMER20" }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("SUMMER20");
      expect(screen.getByText("Copied!")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Code copied" }),
      ).toBeInTheDocument();
    });
  });

  it("leaves the chip unchanged when clipboard write fails", async () => {
    writeText.mockRejectedValue(new Error("denied"));

    render(<PromoBanner {...PROPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Copy promo code SUMMER20" }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy promo code SUMMER20" }),
    ).toBeInTheDocument();
  });

  it("sets the session dismiss cookie and hides the banner", () => {
    render(<PromoBanner {...PROPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss promotional offer" }),
    );

    expect(document.cookie).toContain(
      buildPromoDismissDocumentCookie(PROPS.campaignId).split(";")[0]!,
    );
    expect(
      screen.queryByRole("complementary", { name: "Promotional offer" }),
    ).not.toBeInTheDocument();
  });

  it("shows a static Ends date when prefers-reduced-motion is set", () => {
    stubReducedMotion();

    render(<PromoBanner {...PROPS} />);

    expect(screen.getByText(/Ends 31 Aug/i)).toBeInTheDocument();
    expect(screen.queryByText("Ends in")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows Offer ended after endsAt under reduced motion", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T12:00:00.000Z"));
    stubReducedMotion();

    render(<PromoBanner {...PROPS} />);

    expect(screen.getByText(/Ends 31 Aug/i)).toBeInTheDocument();

    act(() => {
      vi.setSystemTime(new Date("2026-08-31T00:00:00.000Z"));
      vi.advanceTimersByTime(
        new Date("2026-08-31T00:00:00.000Z").getTime() -
          new Date("2026-08-15T12:00:00.000Z").getTime(),
      );
    });

    expect(screen.getByText("Offer ended")).toBeInTheDocument();
    expect(screen.queryByText(/Ends 31 Aug/i)).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("chunks expiry scheduling when endsAt exceeds the setTimeout limit", () => {
    vi.useFakeTimers();
    const start = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    stubReducedMotion();

    const endsAtMs = start.getTime() + MAX_SET_TIMEOUT_MS + 60_000;
    const endsAt = new Date(endsAtMs).toISOString();

    render(
      <PromoBanner
        {...PROPS}
        endsAt={endsAt}
        campaignId={`${start.toISOString()}|${endsAt}|SUMMER20`}
        initialNowIso={start.toISOString()}
      />,
    );

    expect(screen.queryByText("Offer ended")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(MAX_SET_TIMEOUT_MS);
    });

    expect(screen.queryByText("Offer ended")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("Offer ended")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("clears the Copied! state after two seconds", async () => {
    vi.useFakeTimers();
    render(<PromoBanner {...PROPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Copy promo code SUMMER20" }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Copied!")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy promo code SUMMER20" }),
    ).toBeInTheDocument();
  });
});
