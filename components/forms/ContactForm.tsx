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
      className="w-full max-w-4xl mx-auto space-y-12 mb-20 px-4 sm:px-0"
    >
      <div className="text-center mb-10 space-y-4 ">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Get in touch <span className="text-tangerine"> with us</span>
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Contact LocalCityWalks for any questions or feedback.
        </p>
      </div>
      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {NAME_EMAIL_FIELDS.map((field) => (
                <FormField
                  key={field}
                  control={form.control}
                  name={field}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        {FIELD_NAMES[field.name]}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Enter your ${FIELD_NAMES[
                            field.name
                          ].toLowerCase()}`}
                          className="h-11"
                          type={FIELD_TYPES[field.name]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Subject</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger className="h-11 py-5">
                        <SelectValue placeholder="Select a subject" />
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
                  <FormLabel className="text-base">Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your message"
                      className="min-h-[150px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-start mt-8">
              <Button
                type="submit"
                size="lg"
                className="px-8 bg-tangerine text-white w-full sm:w-auto"
                disabled={isSubmitting}
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
