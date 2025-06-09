import { z } from "zod";

export const ContactSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  subject: z.string().min(3),
  description: z.string().min(5),
});
