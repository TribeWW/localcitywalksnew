import { describe, expect, it } from "vitest";
import { TourRequestSchema } from "@/lib/validation/forms";

const validBase = {
  fullName: "Jane Smith",
  email: "jane@example.com",
  city: "Barcelona",
  message: "We would love a food-focused walk through the old town.",
  phoneNumber: "",
  adults: 2,
  youth: 0,
  children: 0,
  infants: 0,
  preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  preferredTime: "11:00 AM",
  tourDuration: "2 hours",
  language: "English",
  otherLanguage: "",
  consent: true,
};

describe("TourRequestSchema", () => {
  it("accepts mockup time, duration, and language values", () => {
    const result = TourRequestSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("requires otherLanguage when language is Other", () => {
    const result = TourRequestSchema.safeParse({
      ...validBase,
      language: "Other",
      otherLanguage: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts otherLanguage when language is Other", () => {
    const result = TourRequestSchema.safeParse({
      ...validBase,
      language: "Other",
      otherLanguage: "Catalan",
    });

    expect(result.success).toBe(true);
  });

  it("requires at least one adult", () => {
    const result = TourRequestSchema.safeParse({
      ...validBase,
      adults: 0,
    });

    expect(result.success).toBe(false);
  });

  it("accepts flexible time and duration options", () => {
    const result = TourRequestSchema.safeParse({
      ...validBase,
      preferredTime: "Flexible / not sure yet",
      tourDuration: "Flexible / not sure yet",
    });

    expect(result.success).toBe(true);
  });
});
