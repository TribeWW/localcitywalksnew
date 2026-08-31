/**
 * TourRequestModalShell — Escape and scroll lock behaviour.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import TourRequestModalShell from "@/components/forms/TourRequestModalShell";

describe("TourRequestModalShell", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("locks body scroll while open", () => {
    const { unmount } = render(
      <TourRequestModalShell open onClose={vi.fn()}>
        <p>Form content</p>
      </TourRequestModalShell>,
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();

    render(
      <TourRequestModalShell open onClose={onClose}>
        <p>Form content</p>
      </TourRequestModalShell>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders dialog content when open", () => {
    render(
      <TourRequestModalShell open onClose={vi.fn()}>
        <p>Form content</p>
      </TourRequestModalShell>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("focuses the close button when opened", () => {
    render(
      <TourRequestModalShell open onClose={vi.fn()}>
        <p>Form content</p>
      </TourRequestModalShell>,
    );

    expect(screen.getByLabelText("Close")).toHaveFocus();
  });

  it("restores focus to the previously focused element on close", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <TourRequestModalShell open onClose={vi.fn()}>
        <p>Form content</p>
      </TourRequestModalShell>,
    );

    expect(screen.getByLabelText("Close")).toHaveFocus();

    rerender(
      <TourRequestModalShell open={false} onClose={vi.fn()}>
        <p>Form content</p>
      </TourRequestModalShell>,
    );

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("keeps Tab navigation within the modal", () => {
    render(
      <TourRequestModalShell open onClose={vi.fn()}>
        <button type="button">First field</button>
        <button type="button">Last field</button>
      </TourRequestModalShell>,
    );

    const closeButton = screen.getByLabelText("Close");
    const lastField = screen.getByRole("button", { name: "Last field" });

    lastField.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(closeButton).toHaveFocus();

    closeButton.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(lastField).toHaveFocus();
  });
});
