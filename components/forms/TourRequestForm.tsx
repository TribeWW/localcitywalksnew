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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ParticipantCounter from "@/components/ui/participant-counter";
import { TourRequestSchema } from "@/lib/validation";
import { sendTourRequestEmail } from "@/lib/nodemailer";
import { toast } from "sonner";

interface TourRequestFormProps {
  cityName: string;
  onClose: () => void;
}

const TourRequestForm = ({ cityName, onClose }: TourRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof TourRequestSchema>>({
    resolver: zodResolver(TourRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      city: cityName,
      message: "",
      phoneNumber: "",
      adults: 1,
      youth: 0,
      children: 0,
      consent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof TourRequestSchema>) {
    try {
      setIsSubmitting(true);

      await sendTourRequestEmail({
        fullName: values.fullName,
        email: values.email,
        city: values.city,
        message: values.message,
        phoneNumber: values.phoneNumber,
        adults: values.adults,
        youth: values.youth,
        children: values.children,
        consent: values.consent,
      });

      toast.success(
        "Tour request sent successfully! We'll get back to you soon."
      );

      // Close modal after successful submission
      onClose();
      form.reset();
    } catch (error) {
      toast.error("Failed to send tour request. Please try again later.");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Full Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine"
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
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Phone Number (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+1 234 567 8900 (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-nightsky">Participants</h3>

          <FormField
            control={form.control}
            name="adults"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ParticipantCounter
                    label="Adults (18+)"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youth"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ParticipantCounter
                    label="Youth (13-17)"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="children"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ParticipantCounter
                    label="Children (0-12)"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                City
              </FormLabel>
              <FormControl>
                <Input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  disabled
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-nightsky">
                Message
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Tell us about your tour preferences, preferred dates, group size, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tangerine resize-none"
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
                  className="bg-white"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-nightsky">
                  I agree that LocalCityWalks may use my details to respond to
                  my tour request.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !form.watch("consent")}
          >
            {isSubmitting ? "Sending..." : "Send request"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TourRequestForm;
