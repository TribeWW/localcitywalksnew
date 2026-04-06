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
      <div className="w-full bg-white py-10">
        <section
          aria-labelledby="custom-tour-banner-heading"
          className="px-6 max-w-[1140px] mx-auto"
        >
          <div className="flex items-center gap-8 bg-[#F7F7F7] rounded-[16px] border-[1.5px] border-[#D3CED2] px-8 py-8">
            <Image
              src="/operator.svg"
              alt="Custom tour"
              width={96}
              height={96}
              className="w-24 h-24 shrink-0"
            />
            <div className="flex-1">
              <h2
                id="custom-tour-banner-heading"
                className="text-2xl font-semibold text-[#0F172A] mb-2 leading-[1.35]"
              >
                Looking for a private or custom city walk?
              </h2>
              <p className="text-base text-[#6A6A6A] leading-[1.6] m-0 max-w-[560px]">
                We organise tailor-made walking experiences for private groups,
                families, and corporate events.
              </p>
            </div>
            <button
              type="button"
              className="px-6 py-2 text-base font-medium text-[#0F172A] bg-transparent border-[1.5px] border-[#0F172A] rounded-[8px] cursor-pointer font-['Outfit',sans-serif] whitespace-nowrap shrink-0 transition-all duration-150 hover:bg-[#0F172A] hover:text-white"
              onClick={() => setOpen(true)}
            >
              Request a custom tour
            </button>
          </div>
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
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
