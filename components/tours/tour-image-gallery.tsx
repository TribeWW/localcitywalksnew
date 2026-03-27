"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TourImageGalleryProps {
  images: string[];
  title: string;
}

export default function TourImageGallery({
  images,
  title,
}: TourImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const canNavigate = safeImages.length > 1;
  /** Photos beyond the four mosaic slots (only relevant when we show all four previews). */
  const remainingAfterFour = Math.max(0, safeImages.length - 4);

  function openAt(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function goTo(index: number) {
    if (!trackRef.current) return;
    const bounded = Math.max(0, Math.min(index, safeImages.length - 1));
    const target = trackRef.current.children.item(bounded) as HTMLElement | null;
    target?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActiveIndex(bounded);
  }

  function goNext() {
    if (!canNavigate) return;
    goTo((activeIndex + 1) % safeImages.length);
  }

  function goPrev() {
    if (!canNavigate) return;
    goTo((activeIndex - 1 + safeImages.length) % safeImages.length);
  }

  useEffect(() => {
    if (!open) return;
    goTo(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex, safeImages.length]);

  function onTrackScroll() {
    if (!trackRef.current) return;
    const width = trackRef.current.clientWidth;
    if (width <= 0) return;
    const nextIndex = Math.round(trackRef.current.scrollLeft / width);
    if (nextIndex !== activeIndex) {
      setActiveIndex(Math.max(0, Math.min(nextIndex, safeImages.length - 1)));
    }
  }

  if (safeImages.length === 0) return null;

  const n = safeImages.length;

  return (
    <>
      {/* Mobile: show one image only, open fullscreen on tap */}
      <button
        type="button"
        onClick={() => openAt(0)}
        className="relative mb-10 h-[260px] w-full overflow-hidden rounded-xl bg-white shadow-sm md:hidden"
        aria-label="Open image gallery fullscreen"
      >
        <Image
          src={safeImages[0]}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 767px) 100vw, 1px"
          priority
        />
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-3 py-1 text-xs font-medium text-white">
            {safeImages.length} photos
          </div>
        )}
      </button>

      {/* Desktop: mosaic adapts when fewer than four images (no duplicate indices). */}
      <section className="mb-10 hidden md:block">
        {n === 1 ? (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="relative h-[420px] w-full overflow-hidden rounded-xl bg-white shadow-sm"
            aria-label="Open image gallery fullscreen"
          >
            <Image
              src={safeImages[0]}
              alt={`${title} image 1`}
              fill
              className="object-cover"
              sizes="(max-width: 767px) 1px, min(100vw, 1152px)"
              priority
            />
          </button>
        ) : n === 2 ? (
          <div className="grid h-[420px] grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => openAt(i)}
                className="relative overflow-hidden rounded-xl bg-white shadow-sm"
                aria-label={`Open image ${i + 1} fullscreen`}
              >
                <Image
                  src={safeImages[i]}
                  alt={`${title} image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 1px, 45vw"
                />
              </button>
            ))}
          </div>
        ) : n === 3 ? (
          <div className="grid h-[420px] grid-cols-12 grid-rows-2 gap-3">
            <button
              type="button"
              onClick={() => openAt(0)}
              className="relative col-span-6 row-span-2 overflow-hidden rounded-xl bg-white shadow-sm"
              aria-label="Open image 1 fullscreen"
            >
              <Image
                src={safeImages[0]}
                alt={`${title} image 1`}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 1px, 50vw"
                priority
              />
            </button>
            <button
              type="button"
              onClick={() => openAt(1)}
              className="relative col-span-6 row-start-1 overflow-hidden rounded-xl bg-white shadow-sm"
              aria-label="Open image 2 fullscreen"
            >
              <Image
                src={safeImages[1]}
                alt={`${title} image 2`}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 1px, 45vw"
              />
            </button>
            <button
              type="button"
              onClick={() => openAt(2)}
              className="relative col-span-6 row-start-2 overflow-hidden rounded-xl bg-white shadow-sm"
              aria-label="Open image 3 fullscreen"
            >
              <Image
                src={safeImages[2]}
                alt={`${title} image 3`}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 1px, 45vw"
              />
            </button>
          </div>
        ) : (
          <div className="grid h-[420px] grid-cols-12 gap-3">
            <button
              type="button"
              onClick={() => openAt(0)}
              className="relative col-span-6 overflow-hidden rounded-xl bg-white shadow-sm"
              aria-label="Open image 1 fullscreen"
            >
              <Image
                src={safeImages[0]}
                alt={`${title} image 1`}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 1px, 50vw"
                priority
              />
            </button>

            <button
              type="button"
              onClick={() => openAt(1)}
              className="relative col-span-3 overflow-hidden rounded-xl bg-white shadow-sm"
              aria-label="Open image 2 fullscreen"
            >
              <Image
                src={safeImages[1]}
                alt={`${title} image 2`}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 1px, 26vw"
              />
            </button>

            <div className="col-span-3 grid grid-rows-2 gap-3">
              <button
                type="button"
                onClick={() => openAt(2)}
                className="relative overflow-hidden rounded-xl bg-white shadow-sm"
                aria-label="Open image 3 fullscreen"
              >
                <Image
                  src={safeImages[2]}
                  alt={`${title} image 3`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 1px, 26vw"
                />
              </button>

              <button
                type="button"
                onClick={() => openAt(3)}
                className="relative overflow-hidden rounded-xl bg-white shadow-sm"
                aria-label={
                  remainingAfterFour > 0
                    ? `Open gallery fullscreen, ${remainingAfterFour} more photos not shown in preview`
                    : "Open image 4 fullscreen"
                }
              >
                <Image
                  src={safeImages[3]}
                  alt={`${title} image 4`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 1px, 26vw"
                />
                {remainingAfterFour > 0 ? (
                  <div className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-1.5 text-sm font-medium text-nightsky shadow">
                    <Eye className="size-4" />
                    <span>{`+${remainingAfterFour} photos`}</span>
                  </div>
                ) : null}
              </button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 h-screen w-screen max-w-[100vw] translate-x-0 translate-y-0 rounded-none border-0 bg-black/95 p-0 sm:max-w-[100vw]"
        >
          <DialogTitle className="sr-only">Tour image gallery</DialogTitle>

          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-4 z-50 border-white/30 bg-black/40 text-white hover:bg-black/60"
              aria-label="Close gallery"
            >
              <X />
            </Button>
          </DialogClose>

          {canNavigate && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={goPrev}
                className="absolute left-4 top-1/2 z-50 -translate-y-1/2 border-white/30 bg-black/40 text-white hover:bg-black/60"
                aria-label="Previous image"
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={goNext}
                className="absolute right-4 top-1/2 z-50 -translate-y-1/2 border-white/30 bg-black/40 text-white hover:bg-black/60"
                aria-label="Next image"
              >
                <ChevronRight />
              </Button>
            </>
          )}

          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-md bg-black/50 px-3 py-1 text-sm text-white">
            {activeIndex + 1} / {safeImages.length}
          </div>

          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
          >
            {safeImages.map((url, index) => (
              <div
                key={`${url}-slide-${index}`}
                className="relative h-full min-w-full snap-center"
              >
                <Image
                  src={url}
                  alt={`${title} image ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

