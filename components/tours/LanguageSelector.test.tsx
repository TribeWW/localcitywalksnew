/**
 * LanguageSelector — red/green TDD specs (LOC-1051).
 *
 * Critical invariants:
 * - Bókun codes map to human labels (`EN_GB` → English)
 * - Duplicate codes are deduplicated
 * - Empty language list disables the control
 * - Selection calls `onChange` with the raw Bókun code (not the label)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LanguageSelector from "@/components/tours/LanguageSelector";

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <select
      data-testid="language-select"
      aria-label="Tour language"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

describe("LanguageSelector — label and selection invariants", () => {
  it("label invariant: maps EN_GB to English in the option text", () => {
    render(
      <LanguageSelector
        languages={["EN_GB"]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("option", { name: "English" })).toHaveValue(
      "EN_GB",
    );
  });

  it("dedupe invariant: renders each language code once", () => {
    render(
      <LanguageSelector
        languages={["EN_GB", " EN_GB ", "FR"]}
        onChange={vi.fn()}
      />,
    );

    const options = screen.getAllByRole("option").filter((el) => el.getAttribute("value"));
    const values = options.map((option) => option.getAttribute("value"));

    expect(values).toEqual(expect.arrayContaining(["EN_GB", "FR"]));
    expect(values.filter((value) => value === "EN_GB")).toHaveLength(1);
  });

  it("disabled invariant: disables select when languages array is empty", () => {
    render(<LanguageSelector languages={[]} onChange={vi.fn()} />);

    expect(screen.getByTestId("language-select")).toBeDisabled();
  });

  it("selection invariant: onChange receives raw Bókun code, not display label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LanguageSelector languages={["FR", "EN_GB"]} onChange={onChange} />,
    );

    await user.selectOptions(screen.getByTestId("language-select"), "FR");

    expect(onChange).toHaveBeenCalledWith("FR");
  });
});
