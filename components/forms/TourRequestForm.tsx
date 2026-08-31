"use client";

import React, { useCallback, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import TourRequestConfigureStep from "@/components/forms/TourRequestConfigureStep";
import TourRequestContactStep from "@/components/forms/TourRequestContactStep";
import TourRequestSuccessToast from "@/components/forms/TourRequestSuccessToast";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  TOUR_REQUEST_DURATION_OPTIONS,
  TOUR_REQUEST_LANGUAGE_OPTIONS,
  TOUR_REQUEST_TIME_OPTIONS,
} from "@/lib/forms/tour-request-options";
import { sendTourRequestEmail } from "@/lib/nodemailer";
import {
  TOUR_REQUEST_STEP_ONE_FIELDS,
  TourRequestSchema,
} from "@/lib/validation/forms";

type TourRequestFormValues = z.infer<typeof TourRequestSchema>;

type TourRequestFormProps =
  | {
      lockCity: true;
      initialCity: string;
      onClose: () => void;
      onSuccess?: () => void;
      presentation?: "inline" | "modal";
      showStepHeadings?: boolean;
      elevatedLayer?: boolean;
    }
  | {
      lockCity?: false;
      initialCity?: string;
      onClose: () => void;
      onSuccess?: () => void;
      presentation?: "inline" | "modal";
      showStepHeadings?: boolean;
      elevatedLayer?: boolean;
    };

const STEP_COPY = {
  1: {
    title: "Customise your walking tour",
    description: "Tell us what you have in mind.",
  },
  2: {
    title: "How can we reach you?",
    description: "Add your details and we'll be in touch.",
  },
} as const;

function buildDefaultValues(
  lockCity: boolean,
  initialCity?: string,
): TourRequestFormValues {
  return {
    fullName: "",
    email: "",
    city: lockCity ? (initialCity ?? "") : (initialCity ?? ""),
    message: "",
    phoneNumber: "",
    adults: 2,
    youth: 0,
    children: 0,
    infants: 0,
    preferredDate: undefined as unknown as Date,
    preferredTime: TOUR_REQUEST_TIME_OPTIONS[0],
    tourDuration: TOUR_REQUEST_DURATION_OPTIONS[2],
    language: TOUR_REQUEST_LANGUAGE_OPTIONS[0],
    otherLanguage: "",
    consent: false,
  };
}

const SUBMIT_EMAIL_FAILURE_ERROR =
  "Failed to send tour request. Please try again later.";

const TourRequestForm = ({
  initialCity,
  lockCity = true,
  onClose,
  onSuccess,
  presentation = "inline",
  showStepHeadings = true,
  elevatedLayer = false,
}: TourRequestFormProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const stepContentRef = useRef<HTMLDivElement>(null);

  if (lockCity && !initialCity) {
    console.error(
      "[TourRequestForm] lockCity=true requires a non-empty initialCity.",
    );
    throw new Error(
      "TourRequestForm misconfigured: lockCity=true requires initialCity.",
    );
  }

  const form = useForm<TourRequestFormValues>({
    resolver: zodResolver(TourRequestSchema),
    defaultValues: buildDefaultValues(lockCity, initialCity),
  });

  const resetForm = useCallback(() => {
    setStep(1);
    setConsentError(false);
    setSubmitError(null);
    form.reset(buildDefaultValues(lockCity, initialCity));
  }, [form, initialCity, lockCity]);

  const focusStepContent = () => {
    requestAnimationFrame(() => {
      stepContentRef.current
        ?.querySelector<HTMLElement>(
          "input, textarea, button, select, [tabindex]",
        )
        ?.focus();
    });
  };

  const handleNext = async () => {
    const stepOneFields = lockCity
      ? TOUR_REQUEST_STEP_ONE_FIELDS.filter((field) => field !== "city")
      : [...TOUR_REQUEST_STEP_ONE_FIELDS];

    const valid = await form.trigger(stepOneFields);
    if (!valid) return;

    setStep(2);
    focusStepContent();
  };

  const handleBack = () => {
    setStep(1);
    setConsentError(false);
    setSubmitError(null);
    focusStepContent();
  };

  async function onSubmit(values: TourRequestFormValues) {
    if (!values.consent) {
      setConsentError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await sendTourRequestEmail({
        fullName: values.fullName,
        email: values.email,
        city: values.city,
        message: values.message,
        phoneNumber: values.phoneNumber,
        adults: values.adults,
        youth: values.youth,
        children: values.children,
        infants: values.infants,
        preferredDate: values.preferredDate,
        preferredTime: values.preferredTime,
        tourDuration: values.tourDuration,
        language: values.language,
        otherLanguage: values.otherLanguage,
        consent: values.consent,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        setShowSuccessToast(true);
        onClose();
      }

      resetForm();
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError(SUBMIT_EMAIL_FAILURE_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepCopy = STEP_COPY[step];

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={
            presentation === "modal"
              ? undefined
              : "max-h-[70vh] overflow-y-auto pr-1"
          }
        >
          {showStepHeadings ? (
            <header className="mb-6 pr-8">
              <h2
                id="custom-tour-title"
                className="mb-2 text-2xl font-semibold leading-[1.35] text-nightsky"
              >
                {stepCopy.title}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {stepCopy.description}
              </p>
            </header>
          ) : null}

          <div ref={stepContentRef}>
            {step === 1 ? (
              <TourRequestConfigureStep
                form={form}
                lockCity={lockCity}
                onNext={handleNext}
                elevatedLayer={elevatedLayer}
              />
            ) : (
              <TourRequestContactStep
                control={form.control}
                isSubmitting={isSubmitting}
                consentError={consentError}
                submitError={submitError}
                onBack={handleBack}
                onConsentChange={(checked) => {
                  if (checked) setConsentError(false);
                }}
              />
            )}
          </div>

          {lockCity ? (
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : null}
        </form>
      </Form>

      {showSuccessToast && !onSuccess ? (
        <TourRequestSuccessToast onDismiss={() => setShowSuccessToast(false)} />
      ) : null}
    </>
  );
};

export default TourRequestForm;
