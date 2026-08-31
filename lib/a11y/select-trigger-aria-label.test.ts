import { describe, expect, it } from "vitest";
import { buildSelectTriggerAriaLabel } from "@/lib/a11y/select-trigger-aria-label";

describe("buildSelectTriggerAriaLabel", () => {
  it("returns the field label when nothing is selected", () => {
    expect(buildSelectTriggerAriaLabel("Preferred time")).toBe("Preferred time");
    expect(buildSelectTriggerAriaLabel("Preferred time", "")).toBe(
      "Preferred time",
    );
  });

  it("includes the selected option label when present", () => {
    expect(buildSelectTriggerAriaLabel("Language", "English")).toBe(
      "Language, English",
    );
  });
});
