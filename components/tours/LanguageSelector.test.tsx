/**
 * LanguageSelector — red/green TDD specs (LOC-1051).
 *
 * Critical invariants:
 * - Renders Bókun displayLanguages labels from options
 * - Duplicate codes are deduplicated
 * - Empty options disables the control
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
  it("label invariant: renders displayLanguages from options", () => {
    render(
      <LanguageSelector
        options={[{ code: "en", label: "English" }]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("option", { name: "English" })).toHaveValue("en");
  });

  it("dedupe invariant: renders each language code once", () => {
    render(
      <LanguageSelector
        options={[
          { code: "en", label: "English" },
          { code: "en", label: "English duplicate" },
          { code: "es", label: "Spanish" },
        ]}
        onChange={vi.fn()}
      />,
    );

    const options = screen.getAllByRole("option").filter((el) => el.getAttribute("value"));
    const values = options.map((option) => option.getAttribute("value"));

    expect(values).toEqual(expect.arrayContaining(["en", "es"]));
    expect(values.filter((value) => value === "en")).toHaveLength(1);
  });

  it("disabled invariant: disables select when options array is empty", () => {
    render(<LanguageSelector options={[]} onChange={vi.fn()} />);

    expect(screen.getByTestId("language-select")).toBeDisabled();
  });

  it("selection invariant: onChange receives raw Bókun code, not display label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LanguageSelector
        options={[
          { code: "es", label: "Spanish" },
          { code: "en", label: "English" },
        ]}
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByTestId("language-select"), "es");

    expect(onChange).toHaveBeenCalledWith("es");
  });
});
