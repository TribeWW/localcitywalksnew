"use client";
import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ContactSchema } from "@/lib/validation/forms";
import { FIELD_NAMES, FIELD_TYPES } from "@/constants";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { sendEmail } from "@/lib/nodemailer";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactSectionHeading } from "@/components/contact/ContactSectionHeading";
import { cn } from "@/lib/utils";

const OPTIONS = ["General Inquiry", "Booking Questions", "Collaborations"];

const FIELD_ITEM_IDS = {
  fullName: "contact-full-name",
  email: "contact-email",
  subject: "contact-subject",
  description: "contact-description",
  consent: "contact-consent",
} as const;

const PLACEHOLDERS = {
  fullName: "Jane Smith",
  email: "jane@example.com",
  description: "How can we help?",
} as const;

const formShellClassName =
  "w-full rounded-2xl border-[1.5px] border-border bg-white p-6 md:p-8";

const formLabelClassName = "text-sm data-[error=true]:text-nightsky";

const submitButtonClassName =
  "btn-default w-full cursor-pointer bg-nightsky text-white hover:bg-nightsky/90 disabled:cursor-not-allowed disabled:opacity-50";

export interface ContactFormProps {
  /** When true, shows "Send us a message" heading above the fields. */
  showHeading?: boolean;
  /** Optional class names for the outer form shell. */
  className?: string;
}

const ContactForm = ({ showHeading = false, className }: ContactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Radix Select/Checkbox use React.useId(); with Next 15.5 streaming those IDs
  // can diverge on hydrate. Mount the interactive form only on the client.
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const form = useForm<z.infer<typeof ContactSchema>>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      subject: "",
      description: "",
      consent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof ContactSchema>) {
    try {
      setIsSubmitting(true);
      await sendEmail({
        name: values.fullName,
        email: values.email,
        subject: values.subject,
        message: values.description,
        consent: values.consent,
      });

      toast.success("Message sent!", {
        description:
          "We'll get back to you within one business day. Please also check your spam folder, just in case.",
      });

      form.reset();
    } catch (error) {
      toast("Failed to send message. Please try again later. " + error, {
        className: "bg-destructive text-white",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasMounted) {
    return (
      <div
        className={cn(formShellClassName, "min-h-[480px]", className)}
        aria-busy="true"
        aria-label="Loading contact form"
      />
    );
  }

  return (
    <div className={cn(formShellClassName, className)}>
      {showHeading && (
        <ContactSectionHeading
          title="Send us a message"
          lead="Fill in the form and we'll get back to you as soon as we can."
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem id={FIELD_ITEM_IDS.fullName}>
                <FormLabel className={formLabelClassName}>{FIELD_NAMES.fullName}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={PLACEHOLDERS.fullName}
                    className="h-10 rounded-[4px] bg-white text-[#000] placeholder:text-muted-foreground"
                    type={FIELD_TYPES.fullName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem id={FIELD_ITEM_IDS.email}>
                <FormLabel className={formLabelClassName}>Email address</FormLabel>
                <FormControl>
                  <Input
                    placeholder={PLACEHOLDERS.email}
                    className="h-10 rounded-[4px] bg-white text-[#000] placeholder:text-muted-foreground"
                    type={FIELD_TYPES.email}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem id={FIELD_ITEM_IDS.subject}>
                <FormLabel className={formLabelClassName}>Subject</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl className="w-full rounded-[4px]">
                    <SelectTrigger className="bg-white py-[18px] text-[#000] placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem id={FIELD_ITEM_IDS.description}>
                <FormLabel className={formLabelClassName}>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={PLACEHOLDERS.description}
                    className="min-h-[150px] resize-none rounded-[4px] bg-white text-[#000] placeholder:text-muted-foreground"
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem
                id={FIELD_ITEM_IDS.consent}
                className="mt-2 flex flex-row items-start space-x-3 space-y-0"
              >
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 bg-white"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel
                    className={cn(
                      formLabelClassName,
                      "leading-relaxed text-nightsky",
                    )}
                  >
                    I agree that LocalCityWalks may use my details to respond to
                    my message.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="mt-4">
            <button
              type="submit"
              className={submitButtonClassName}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Get in touch"}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ContactForm;
