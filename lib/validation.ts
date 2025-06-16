import { z } from "zod";

export const ContactSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  subject: z.string().min(3),
  description: z.string().min(5),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to submit the form",
  }),
});
