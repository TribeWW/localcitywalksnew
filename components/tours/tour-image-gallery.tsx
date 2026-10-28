"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { resizeBokunLightboxThumbnailUrl } from "@/lib/bokun/resize-bokun-lightbox-thumbnail-url";
import { cn } from "@/lib/utils";

interface TourImageGalleryProps {
  images: string[];
  title: string;
}

/** Instant jump; "instant" matches the ScrollToOptions value browsers accept. */
const SCROLL_INSTANT = "instant" as ScrollBehavior;

/** Lightbox photo aspect ratio (900 × 600 → 3:2). */
const LIGHTBOX_PHOTO_WIDTH = 900;
const LIGHTBOX_PHOTO_HEIGHT = 600;

const PHOTO_CONTROL_ICON =
  "photo-control size-10 shrink-0 rounded-full text-nightsky shadow-none hover:bg-white/95 hover:text-nightsky";

export default function TourImageGallery({
  images,
  title,
}: TourImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [thumbFade, setThumbFade] = useState({ left: false, right: false });

  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRowRef = useRef<HTMLDivElement | null>(null);
  const thumbButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Index to jump to when the Dialog portal mounts the snap strip. */
  const pendingOpenIndexRef = useRef<number | null>(null);
  /**
   * While next/prev animates with smooth scroll, onScroll still reports the
   * old photo. Hold the target index here and ignore those mid move updates.
   */
  const programmaticTargetRef = useRef<number | null>(null);
  /** Backdrop close only when pointer down and up both hit a backdrop mark. */
  const backdropPointerDownRef = useRef(false);
  const backdropPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const skipThumbCentreSmoothRef = useRef(false);

  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const canNavigate = safeImages.length > 1;
  /** Photos beyond the four mosaic slots (only relevant when we show all four previews). */
  const remainingAfterFour = Math.max(0, safeImages.length - 4);

  function markImageFailed(index: number) {
    setFailedIndexes((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  function scrollTrackTo(index: number, behavior: ScrollBehavior) {
    const track = trackRef.current;
    if (!track) return false;
    const bounded = Math.max(0, Math.min(index, safeImages.length - 1));
    const width = track.clientWidth;
    if (width <= 0) return false;
    track.scrollTo({ left: bounded * width, behavior });
    return true;
  }

  function isStripNeighbor(from: number, to: number) {
    return Math.abs(from - to) === 1;
  }

  /** Smooth when allowed; instant when the user prefers reduced motion. */
  function getAnimatedScrollBehavior(): ScrollBehavior {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return SCROLL_INSTANT;
    }
    return "smooth";
  }

  function updateThumbFade() {
    const row = thumbRowRef.current;
    if (!row) {
      setThumbFade((prev) =>
        !prev.left && !prev.right ? prev : { left: false, right: false },
      );
      return;
    }
    const maxScroll = row.scrollWidth - row.clientWidth;
    const left = row.scrollLeft > 1;
    const right = maxScroll - row.scrollLeft > 1;
    setThumbFade((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right },
    );
  }

  function centreActiveThumbnail(behavior: ScrollBehavior): boolean {
    const row = thumbRowRef.current;
    const thumb = thumbButtonRefs.current[activeIndex];
    if (!row || !thumb) return false;

    const rowRect = row.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const delta =
      thumbRect.left + thumbRect.width / 2 - (rowRect.left + rowRect.width / 2);
    if (Math.abs(delta) < 1) {
      updateThumbFade();
      return true;
    }
    row.scrollBy({ left: delta, behavior });
    if (behavior === SCROLL_INSTANT) {
      updateThumbFade();
    }
    return true;
  }

  function openAt(index: number) {
    const bounded = Math.max(0, Math.min(index, safeImages.length - 1));
    pendingOpenIndexRef.current = bounded;
    programmaticTargetRef.current = null;
    skipThumbCentreSmoothRef.current = true;
    setActiveIndex(bounded);
    setOpen(true);
  }

  function goTo(index: number) {
    const bounded = Math.max(0, Math.min(index, safeImages.length - 1));
    const behavior = isStripNeighbor(activeIndex, bounded)
      ? getAnimatedScrollBehavior()
      : SCROLL_INSTANT;
    programmaticTargetRef.current = bounded;
    scrollTrackTo(bounded, behavior);
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

  function closeLightbox() {
    pendingOpenIndexRef.current = null;
    programmaticTargetRef.current = null;
    setOpen(false);
  }

  /**
   * Radix Dialog mounts portal content after open flips true, so a plain
   * useEffect often runs while trackRef is still null. A callback ref scrolls
   * once the snap strip exists, without sliding through earlier photos.
   */
  function setTrackRef(node: HTMLDivElement | null) {
    trackRef.current = node;
    if (!node) return;

    const index = pendingOpenIndexRef.current;
    if (index == null) return;

    const apply = () => {
      if (trackRef.current !== node) return;
      if (scrollTrackTo(index, SCROLL_INSTANT)) {
        pendingOpenIndexRef.current = null;
      }
    };

    apply();
    if (pendingOpenIndexRef.current != null) {
      requestAnimationFrame(apply);
    }
  }

  function setThumbRowRef(node: HTMLDivElement | null) {
    thumbRowRef.current = node;
    if (!node) return;
    requestAnimationFrame(() => {
      updateThumbFade();
      if (
        skipThumbCentreSmoothRef.current &&
        centreActiveThumbnail(SCROLL_INSTANT)
      ) {
        skipThumbCentreSmoothRef.current = false;
      }
    });
  }

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

  useEffect(() => {
    if (!open) return;
    const behavior = skipThumbCentreSmoothRef.current
      ? SCROLL_INSTANT
      : getAnimatedScrollBehavior();
    if (centreActiveThumbnail(behavior) && skipThumbCentreSmoothRef.current) {
      skipThumbCentreSmoothRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      scrollTrackTo(activeIndex, SCROLL_INSTANT);
      centreActiveThumbnail(SCROLL_INSTANT);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex, safeImages.length]);

  function onTrackScroll() {
    if (!trackRef.current) return;
    const width = trackRef.current.clientWidth;
    if (width <= 0) return;
    const nextIndex = Math.max(
      0,
      Math.min(
        Math.round(trackRef.current.scrollLeft / width),
        safeImages.length - 1,
      ),
    );

    const programmaticTarget = programmaticTargetRef.current;
    if (programmaticTarget != null) {
      if (nextIndex === programmaticTarget) {
        programmaticTargetRef.current = null;
      }
      // Keep the counter on the click target until the strip arrives.
      return;
    }

    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  }

  function isBackdropTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest("[data-photo-backdrop]") &&
      !target.closest("[data-photo-chrome]"),
    );
  }

  function onBackdropPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!isBackdropTarget(event.target)) {
      backdropPointerDownRef.current = false;
      backdropPointerStartRef.current = null;
      return;
    }
    backdropPointerDownRef.current = true;
    backdropPointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function onBackdropPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const start = backdropPointerStartRef.current;
    const hitBackdrop = isBackdropTarget(event.target);
    const moved =
      start != null &&
      (Math.abs(event.clientX - start.x) > 8 ||
        Math.abs(event.clientY - start.y) > 8);
    if (backdropPointerDownRef.current && hitBackdrop && !moved) {
      closeLightbox();
    }
    backdropPointerDownRef.current = false;
    backdropPointerStartRef.current = null;
  }

  function onThumbRowWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const row = thumbRowRef.current;
    if (!row) return;
    const maxScroll = row.scrollWidth - row.clientWidth;
    if (maxScroll <= 0) return;
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    row.scrollLeft += event.deltaY;
    updateThumbFade();
  }

  if (safeImages.length === 0) return null;

  const n = safeImages.length;
  const badgeClass =
    "photo-control inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-nightsky shadow-none";

  return (
    <>
      {/* Mobile: show one image only, open fullscreen on tap */}
      <button
        type="button"
        onClick={() => openAt(0)}
        className="relative mb-10 h-[260px] w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm md:hidden"
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
          <div className={cn(badgeClass, "absolute bottom-3 right-3")}>
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
            className="relative h-[420px] w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
                className="relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
              className="relative col-span-6 row-span-2 cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
              className="relative col-span-6 row-start-1 cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
              className="relative col-span-6 row-start-2 cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
              className="relative col-span-6 cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
              className="relative col-span-3 cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
                className="relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
                className="relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
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
                  <div className={cn(badgeClass, "absolute bottom-3 right-3")}>
                    <Eye className="size-4" aria-hidden />
                    <span>{`+${remainingAfterFour} photos`}</span>
                  </div>
                ) : null}
              </button>
            </div>
          </div>
        )}
      </section>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            pendingOpenIndexRef.current = null;
            programmaticTargetRef.current = null;
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[60] bg-[rgba(0,0,0,0.96)]"
          tabIndex={-1}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const target = event.currentTarget as HTMLElement | null;
            target?.focus({ preventScroll: true });
          }}
          className={cn(
            "top-0 left-0 z-[60] flex h-dvh w-screen max-w-[100vw] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-[100vw]",
            "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
          )}
          onPointerDown={onBackdropPointerDown}
          onPointerUp={onBackdropPointerUp}
        >
          <DialogTitle className="sr-only">Tour photos</DialogTitle>

          <div
            data-photo-chrome
            className="relative z-10 flex h-16 w-full shrink-0 items-center justify-center px-4"
          >
            <div className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white">
              {activeIndex + 1} / {safeImages.length}
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  PHOTO_CONTROL_ICON,
                  "absolute right-4 top-1/2 -translate-y-1/2",
                )}
                aria-label="Close photos"
              >
                <X className="size-5" aria-hidden />
              </Button>
            </DialogClose>
          </div>

          <div
            data-photo-backdrop
            className="relative flex min-h-0 flex-1 flex-col"
          >
            <div
              data-photo-backdrop
              className={cn(
                "relative flex min-h-0 flex-1 items-center",
                "px-2 pb-[max(24px,env(safe-area-inset-bottom))] md:px-16 md:pb-0",
              )}
            >
              {canNavigate ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-photo-chrome
                    onClick={goPrev}
                    className={cn(
                      PHOTO_CONTROL_ICON,
                      "absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 md:inline-flex",
                    )}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-photo-chrome
                    onClick={goNext}
                    className={cn(
                      PHOTO_CONTROL_ICON,
                      "absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 md:inline-flex",
                    )}
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </Button>
                </>
              ) : null}

              <div
                ref={setTrackRef}
                onScroll={onTrackScroll}
                data-photo-backdrop
                className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {safeImages.map((url, index) => {
                  const failed = failedIndexes.has(index);
                  return (
                    <div
                      key={`${url}-slide-${index}`}
                      data-photo-backdrop
                      className="flex h-full min-w-full snap-center items-center justify-center"
                    >
                      {failed ? (
                        <div
                          data-photo-chrome
                          className="h-full max-h-full w-full max-w-full rounded-lg bg-black/40 md:max-h-[calc(100dvh-4rem-6.5rem)]"
                          aria-hidden
                        />
                      ) : (
                        <Image
                          src={url}
                          alt={`${title} image ${index + 1}`}
                          width={LIGHTBOX_PHOTO_WIDTH}
                          height={LIGHTBOX_PHOTO_HEIGHT}
                          data-photo-chrome
                          onError={() => markImageFailed(index)}
                          className={cn(
                            "h-auto rounded-lg object-contain",
                            // Fill the stage; keep 900×600 ratio (max-* alone never enlarges).
                            "w-[min(100%,calc((100dvh-4rem-1.5rem)*900/600))] max-h-[calc(100dvh-4rem-1.5rem)]",
                            "md:w-[min(100%,calc((100dvh-4rem-6.5rem)*900/600))] md:max-h-[calc(100dvh-4rem-6.5rem)]",
                          )}
                          sizes="(max-width: 767px) calc(100vw - 16px), calc(100vw - 128px)"
                          priority={index === activeIndex}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {canNavigate ? (
              <div
                data-photo-chrome
                className="relative z-10 hidden w-full shrink-0 justify-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 md:flex"
              >
                <div
                  className={cn(
                    "relative w-fit max-w-full lg:max-w-[768px]",
                    thumbFade.left &&
                      "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-8 before:bg-gradient-to-r before:from-black before:to-transparent",
                    thumbFade.right &&
                      "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-8 after:bg-gradient-to-l after:from-black after:to-transparent",
                  )}
                >
                  <div
                    ref={setThumbRowRef}
                    onScroll={updateThumbFade}
                    onWheel={onThumbRowWheel}
                    className="flex w-fit max-w-full gap-2 overflow-x-auto overscroll-x-contain p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {safeImages.map((url, index) => {
                      const thumbUrl = resizeBokunLightboxThumbnailUrl(url);
                      const failed = failedIndexes.has(index);
                      const isActive = index === activeIndex;
                      return (
                        <button
                          key={`${url}-thumb-${index}`}
                          type="button"
                          ref={(node) => {
                            thumbButtonRefs.current[index] = node;
                          }}
                          onClick={() => goTo(index)}
                          aria-label={`Go to image ${index + 1}`}
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-black/40",
                            isActive &&
                              "outline outline-2 outline-offset-2 outline-white",
                          )}
                        >
                          {failed ? null : (
                            <Image
                              src={thumbUrl}
                              alt=""
                              fill
                              loading="lazy"
                              className="object-cover"
                              sizes="80px"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
