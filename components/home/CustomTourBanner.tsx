"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TourRequestForm from "@/components/forms/TourRequestForm";

export default function CustomTourBanner() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Custom Tour Banner */}
      <div className="w-full bg-white py-8 md:py-10">
        <section
          aria-labelledby="custom-tour-banner-heading"
          className="px-4 sm:px-6 max-w-[1140px] mx-auto"
        >
          <div className="flex flex-col items-center gap-6 text-center bg-[#F7F7F7] rounded-[16px] border-[1.5px] border-[#D3CED2] px-5 py-6 sm:px-6 sm:py-7 md:flex-row md:items-center md:gap-8 md:text-left md:px-8 md:py-8">
            <Image
              src="/operator.svg"
              alt="Custom tour"
              width={96}
              height={96}
              className="w-16 h-16 shrink-0 sm:w-20 sm:h-20 md:w-24 md:h-24"
              sizes="(max-width: 768px) 64px, 96px"
            />
            <div className="flex w-full flex-1 flex-col md:min-w-0">
              <h2
                id="custom-tour-banner-heading"
                className="text-xl font-semibold text-[#0F172A] mb-2 leading-[1.35] sm:text-2xl text-balance"
              >
                Looking for a private or custom city walk?
              </h2>
              <p className="text-[15px] sm:text-base text-[#6A6A6A] leading-[1.6] m-0 max-w-[560px] mx-auto md:mx-0 text-pretty">
                We organise tailor-made walking experiences for private groups,
                families, and corporate events.
              </p>
            </div>
            <button
              type="button"
              className="w-full min-h-11 px-6 py-2.5 text-base font-medium text-[#0F172A] bg-transparent border-[1.5px] border-[#0F172A] rounded-[8px] cursor-pointer font-['Outfit',sans-serif] transition-all duration-150 hover:bg-[#0F172A] hover:text-white active:bg-[#0F172A] active:text-white md:w-auto md:shrink-0 md:whitespace-nowrap touch-manipulation"
              onClick={() => setOpen(true)}
            >
              Request a custom tour
            </button>
          </div>
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90dvh,900px)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request a custom tour</DialogTitle>
            <DialogDescription>
              Share your preferred city, date, and group details.
            </DialogDescription>
          </DialogHeader>

          <TourRequestForm
            lockCity={false}
            initialCity=""
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
