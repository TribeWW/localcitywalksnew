"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SanityReviewListItem } from "@/types/review";
import { ReviewCard } from "./ReviewCard";

const GAP_PX = 24;

function useCarouselPageSize(): 1 | 2 | 3 {
  const [pageSize, setPageSize] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqMd = window.matchMedia("(min-width: 768px)");

    const sync = () => {
      if (mqLg.matches) setPageSize(3);
      else if (mqMd.matches) setPageSize(2);
      else setPageSize(1);
    };

    sync();
    mqLg.addEventListener("change", sync);
    mqMd.addEventListener("change", sync);
    return () => {
      mqLg.removeEventListener("change", sync);
      mqMd.removeEventListener("change", sync);
    };
  }, []);

  return pageSize;
}

type HomeReviewsCarouselProps = {
  reviews: SanityReviewListItem[];
};

/**
 * Home reviews carousel: responsive slides per view, dot pagination, touch swipe.
 * Desktop 3 / tablet 2 / mobile 1 with peek of the next card.
 */
export function HomeReviewsCarousel({ reviews }: HomeReviewsCarouselProps) {
  const pageSize = useCarouselPageSize();
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(reviews.length / pageSize)),
    [reviews.length, pageSize],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
  });

  const [selectedSnap, setSelectedSnap] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedSnap(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const prevSnap = emblaApi.selectedScrollSnap();
    emblaApi.reInit();
    const maxStart = Math.max(0, reviews.length - pageSize);
    const page = Math.floor(prevSnap / pageSize);
    const target = Math.min(page * pageSize, maxStart);
    emblaApi.scrollTo(target, true);
  }, [emblaApi, pageSize, reviews.length]);

  const activePage = Math.min(
    pageCount - 1,
    Math.floor(selectedSnap / pageSize),
  );

  const scrollToPage = useCallback(
    (pageIndex: number) => {
      if (!emblaApi) return;
      const slideIndex = Math.min(
        pageIndex * pageSize,
        Math.max(0, reviews.length - 1),
      );
      emblaApi.scrollTo(slideIndex);
    },
    [emblaApi, pageSize, reviews.length],
  );

  return (
    <div
      className="w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="Recent traveller reviews"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex items-start" style={{ gap: GAP_PX }}>
          {reviews.map((review) => (
            <div
              key={review._id}
              className="flex min-w-0 shrink-0 grow-0 basis-[calc(100%-48px)] md:basis-[calc((100%-24px)/2)] lg:basis-[calc((100%-48px)/3)]"
            >
              <ReviewCard review={review} presentation="home" />
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 ? (
        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
          role="tablist"
          aria-label="Review carousel pages"
        >
          {Array.from({ length: pageCount }).map((_, i) => {
            const isActive = i === activePage;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to page ${i + 1} of ${pageCount}`}
                aria-current={isActive ? true : undefined}
                tabIndex={0}
                className={
                  isActive
                    ? "size-2.5 rounded-full bg-[#0F172A] transition-colors"
                    : "size-2.5 rounded-full bg-[#D3CED2] transition-colors hover:bg-[#9CA3AF]"
                }
                onClick={() => scrollToPage(i)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
