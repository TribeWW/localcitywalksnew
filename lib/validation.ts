import { z } from "zod";

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
          if (!val || val.trim() === "") return true; // Optional field
          // Basic international phone validation: + followed by 7-15 digits
          const phoneRegex = /^\+?[1-9]\d{6,14}$/;
          return phoneRegex.test(val.replace(/\s/g, "")); // Remove spaces for validation
        },
        {
          message:
            "Please enter a valid phone number with country code (e.g., +1 234 567 8900)",
        }
      ),
    adults: z
      .number()
      .min(0, { message: "Adults cannot be negative" })
      .max(20, { message: "Maximum 20 adults per tour" }),
    youth: z
      .number()
      .min(0, { message: "Youth cannot be negative" })
      .max(20, { message: "Maximum 20 youth per tour" }),
    children: z
      .number()
      .min(0, { message: "Children cannot be negative" })
      .max(20, { message: "Maximum 20 children per tour" }),
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
        }
      )
      .refine(
        (date) => {
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          return date <= oneYearFromNow;
        },
        {
          message: "Please select a date within the next year",
        }
      ),
    preferredTime: z
      .string({
        required_error: "Please select a preferred time for your tour",
      })
      .refine(
        (time) => {
          const validTimes = [
            "09:00",
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
          ];
          return validTimes.includes(time);
        },
        {
          message: "Please select a valid time between 09:00 and 17:00",
        }
      ),
    tourDuration: z
      .string({
        required_error: "Please select a tour duration",
      })
      .refine(
        (duration) => {
          const validDurations = [
            "1 hour",
            "90 minutes",
            "2 hours",
            "3 hours",
            "4 hours",
            "5 hours",
          ];
          return validDurations.includes(duration);
        },
        {
          message: "Please select a valid tour duration",
        }
      ),
    consent: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms to submit the form",
    }),
  })
  .refine((data) => data.adults + data.youth + data.children > 0, {
    message: "Please select at least one participant for the tour",
    path: ["adults"], // Show error on adults field
  });
