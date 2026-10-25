import { describe, expect, it } from "vitest";
import { getPageDocumentTitle } from "./page.helpers";

describe("getPageDocumentTitle", () => {
  it("returns the label for a published or draft page id", () => {
    expect(getPageDocumentTitle("homePage")).toBe("Homepage");
    expect(getPageDocumentTitle("drafts.contactPage")).toBe("Contact");
  });

  it("falls back to a generic label for an unknown id", () => {
    expect(getPageDocumentTitle("somethingElse")).toBe("Page");
    expect(getPageDocumentTitle(undefined)).toBe("Page");
  });
});
