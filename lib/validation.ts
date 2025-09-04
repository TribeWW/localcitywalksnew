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

export const TourRequestSchema = z.object({
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
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to submit the form",
  }),
});
