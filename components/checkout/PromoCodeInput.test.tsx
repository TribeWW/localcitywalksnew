/**
 * PromoCodeInput — apply/remove UI invariants (LOC-1232 / LOC-1235).
 *
 * Critical invariants:
 * - Empty input keeps Apply disabled and does not call validation
 * - Invalid validation shows inline error and keeps input mode
 * - Valid validation shows success chip + discount row
 * - Remove restores idle input and notifies parent
 * - Pending state disables Apply/input and blocks double submissions
 * - Unavailable/timeout failures show actionable retry copy
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";

describe("PromoCodeInput", () => {
  it("keeps Apply disabled when the input is empty", () => {
    const onValidate = vi.fn();
    render(
      <PromoCodeInput currency="EUR" onValidate={onValidate} />,
    );

    expect(
      screen.getByPlaceholderText(/promo or gift code/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^apply$/i })).toBeDisabled();
    expect(onValidate).not.toHaveBeenCalled();
  });

  it("disables Apply and input while validation is pending and blocks double submit", async () => {
    let resolveValidate: (value: { valid: false }) => void = () => undefined;
    const onValidate = vi.fn(
      () =>
        new Promise<{ valid: false }>((resolve) => {
          resolveValidate = resolve;
        }),
    );

    render(<PromoCodeInput currency="EUR" onValidate={onValidate} />);

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "SUMMER20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /applying/i })).toBeDisabled();
    });
    expect(screen.getByPlaceholderText(/promo or gift code/i)).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /applying/i }));
    expect(onValidate).toHaveBeenCalledTimes(1);

    resolveValidate({ valid: false });

    await waitFor(() => {
      expect(
        screen.getByText(/this code is invalid or has expired/i),
      ).toBeInTheDocument();
    });
  });

  it("shows an inline invalid error when validation returns invalid", async () => {
    const onValidate = vi.fn().mockResolvedValue({
      valid: false,
      reason: "invalid",
    });
    const onAppliedChange = vi.fn();

    render(
      <PromoCodeInput
        currency="EUR"
        onValidate={onValidate}
        onAppliedChange={onAppliedChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "BADCODE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/this code is invalid or has expired/i),
      ).toBeInTheDocument();
    });

    expect(onValidate).toHaveBeenCalledWith("BADCODE");
    expect(onAppliedChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: expect.any(String) }),
    );
    expect(screen.getByRole("button", { name: /^apply$/i })).toBeInTheDocument();
  });

  it("shows retry copy when validation is unavailable or times out", async () => {
    const onValidate = vi.fn().mockResolvedValue({
      valid: false,
      reason: "unavailable",
    });

    render(<PromoCodeInput currency="EUR" onValidate={onValidate} />);

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "SUMMER20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/unable to verify this code right now/i),
      ).toBeInTheDocument();
    });
  });

  it("shows a success chip and discount row when validation succeeds", async () => {
    const onValidate = vi.fn().mockResolvedValue({
      valid: true,
      code: "SUMMER20",
      discountAmount: 100,
      discountedAmount: 400,
    });
    const onAppliedChange = vi.fn();

    render(
      <PromoCodeInput
        currency="EUR"
        onValidate={onValidate}
        onAppliedChange={onAppliedChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "summer20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(screen.getByText("SUMMER20")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/remove promo code/i)).toBeInTheDocument();
    expect(screen.getByText(/-€100/)).toBeInTheDocument();
    expect(onAppliedChange).toHaveBeenCalledWith({
      code: "SUMMER20",
      discountAmount: 100,
      discountedAmount: 400,
    });
  });

  it("restores the idle input and clears the applied promo on remove", async () => {
    const onValidate = vi.fn().mockResolvedValue({
      valid: true,
      code: "SUMMER20",
      discountAmount: 100,
      discountedAmount: 400,
    });
    const onAppliedChange = vi.fn();

    render(
      <PromoCodeInput
        currency="EUR"
        onValidate={onValidate}
        onAppliedChange={onAppliedChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/promo or gift code/i), {
      target: { value: "SUMMER20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(screen.getByText("SUMMER20")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/remove promo code/i));

    expect(
      screen.getByPlaceholderText(/promo or gift code/i),
    ).toBeInTheDocument();
    expect(onAppliedChange).toHaveBeenLastCalledWith(null);
  });
});
