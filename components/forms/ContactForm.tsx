"use client";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { ContactSchema } from "@/lib/validation";
import { FIELD_NAMES, FIELD_TYPES } from "@/constants";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { sendEmail } from "@/lib/nodemailer";
import { Checkbox } from "@/components/ui/checkbox";

const NAME_EMAIL_FIELDS = ["fullName", "email"] as const;
const OPTIONS = [
  "General Inquiry",
  "Booking Questions",
  "Cancellations or Refunds",
  "Business Partnerships",
  "Collaborations",
  "Legal Questions",
  "Investor Relations",
  "Feedback",
];

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      toast(
        "Success! Your message has been sent. Please check your spam or junk folder if you don't see our reply soon."
      );

      form.reset();
    } catch (error) {
      toast("Failed to send message. Please try again later. " + error, {
        className: "bg-destructive text-white",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      id="contact"
      className="w-full max-w-4xl mx-auto space-y-12 p-8 bg-white rounded-2xl shadow-lg"
    >
      <div className="text-left mb-8 ">
        <h2 className="text-3xl mb-2 font-medium text-[#1E1E1E]">
          Get in touch
        </h2>
        <p className="text-lg text-[#1E1E1E] max-w-2xl ">
          Looking for a personalized quote or have questions?
        </p>
      </div>
      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {NAME_EMAIL_FIELDS.map((field) => (
              <FormField
                key={field}
                control={form.control}
                name={field}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {FIELD_NAMES[field.name]}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter your ${FIELD_NAMES[
                          field.name
                        ].toLowerCase()}`}
                        className="h-10 text-[#000] placeholder-[#6A6A6A] rounded-[4px]"
                        type={FIELD_TYPES[field.name]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Subject</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="w-full rounded-[4px]">
                      <SelectTrigger className="py-[18px] text-[#000] placeholder-[#6A6A6A]">
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
                <FormItem>
                  <FormLabel className="text-sm">Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your message"
                      className="min-h-[110px] resize-none text-[#000] placeholder-[#6A6A6A] rounded-[4px]"
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-[#000]">
                      I agree that LocalCityWalks may use my details to respond
                      to my message.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-start mt-10">
              <Button
                type="submit"
                size="lg"
                className="px-8 bg-nightsky hover:bg- cursor-pointer text-white w-full rounded-[4px]"
                disabled={isSubmitting || !form.watch("consent")}
              >
                {isSubmitting ? "Sending..." : "Get in touch"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ContactForm;
