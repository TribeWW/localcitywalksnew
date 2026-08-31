import { z } from "zod";
import {
  TOUR_REQUEST_DURATION_OPTIONS,
  TOUR_REQUEST_LANGUAGE_OPTIONS,
  TOUR_REQUEST_TIME_OPTIONS,
} from "@/lib/forms/tour-request-options";

export const ContactSchema = z.object({
  fullName: z.string().min(3, {
    message: "Please enter your full name (at least 3 characters)",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  subject: z.string().min(3, {
    message: "Please select a topic",
  }),
  description: z.string().min(5, {
    message: "Please provide a description (at least 5 characters)",
  }),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to submit the form",
  }),
});

export const TourRequestSchema = z
  .object({
    fullName: z.string().min(3, {
      message: "Please enter your full name (at least 3 characters)",
    }),
    email: z.string().email({
      message: "Please enter a valid email address",
    }),
    city: z.string().min(1, {
      message: "Please select a city",
    }),
    message: z.string().min(10, {
      message:
        "Please provide more details about your tour preferences (at least 10 characters)",
    }),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          const phoneRegex = /^\+?[1-9]\d{6,14}$/;
          return phoneRegex.test(val.replace(/\s/g, ""));
        },
        {
          message:
            "Please enter a valid phone number with country code (e.g., +1 234 567 8900)",
        },
      ),
    adults: z
      .number()
      .int()
      .min(1, { message: "At least one adult is required" })
      .max(20, { message: "Maximum 20 adults per tour" }),
    youth: z
      .number()
      .int()
      .min(0, { message: "Youth cannot be negative" })
      .max(20, { message: "Maximum 20 youth per tour" }),
    children: z
      .number()
      .int()
      .min(0, { message: "Children cannot be negative" })
      .max(20, { message: "Maximum 20 children per tour" }),
    infants: z
      .number()
      .int()
      .min(0, { message: "Infants cannot be negative" })
      .max(20, { message: "Maximum 20 infants per tour" }),
    preferredDate: z
      .date({
        required_error: "Please select a preferred date for your tour",
      })
      .refine(
        (date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
        {
          message: "Please select a future date for your tour",
        },
      )
      .refine(
        (date) => {
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          return date <= oneYearFromNow;
        },
        {
          message: "Please select a date within the next year",
        },
      ),
    preferredTime: z
      .string({
        required_error: "Please select a preferred time for your tour",
      })
      .refine(
        (time) =>
          (TOUR_REQUEST_TIME_OPTIONS as readonly string[]).includes(time),
        {
          message: "Please select a valid preferred time",
        },
      ),
    tourDuration: z
      .string({
        required_error: "Please select a tour duration",
      })
      .refine(
        (duration) =>
          (TOUR_REQUEST_DURATION_OPTIONS as readonly string[]).includes(
            duration,
          ),
        {
          message: "Please select a valid tour duration",
        },
      ),
    language: z
      .string({
        required_error: "Please select a language",
      })
      .refine(
        (language) =>
          (TOUR_REQUEST_LANGUAGE_OPTIONS as readonly string[]).includes(
            language,
          ),
        {
          message: "Please select a valid language",
        },
      ),
    otherLanguage: z.string().optional(),
    consent: z.boolean().refine((val) => val === true, {
      message: "Please agree before sending your request.",
    }),
  })
  .refine(
    (data) =>
      data.adults + data.youth + data.children + data.infants > 0,
    {
      message: "Please select at least one participant for the tour",
      path: ["adults"],
    },
  )
  .superRefine((data, ctx) => {
    if (
      data.language === "Other" &&
      (!data.otherLanguage || data.otherLanguage.trim().length < 2)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your language",
        path: ["otherLanguage"],
      });
    }
  });

/** Step 1 field names validated before advancing to contact step. */
export const TOUR_REQUEST_STEP_ONE_FIELDS = [
  "preferredDate",
  "preferredTime",
  "tourDuration",
  "language",
  "otherLanguage",
  "adults",
  "youth",
  "children",
  "infants",
  "message",
  "city",
] as const satisfies readonly (keyof z.infer<typeof TourRequestSchema>)[];
