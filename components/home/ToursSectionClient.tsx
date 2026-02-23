"use client";

import React, { useState, useCallback } from "react";
import CityCard from "@/components/cards/CityCard";
import { getProductsPage } from "@/lib/actions/tour.actions";
import { CityCardData } from "@/types/bokun";

const PAGE_SIZE = 20;

interface ToursSectionClientProps {
  /** First page of city cards (page 1), passed from server */
  initialData: CityCardData[];
  /** Total number of products from Bokun (for "Show more" and pagination) */
  totalHits: number;
}

export default function ToursSectionClient({
  initialData,
  totalHits,
}: ToursSectionClientProps) {
  const [accumulatedList, setAccumulatedList] =
    useState<CityCardData[]>(initialData);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const hasMorePages = accumulatedList.length < totalHits;

  const handleShowMore = useCallback(async () => {
    if (!hasMorePages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getProductsPage(nextPage);
      if (result.success && result.data) {
        setAccumulatedList((prev) => [...prev, ...result.data!]);
        setVisibleCount((prev) => prev + result.data!.length);
        setCurrentPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMorePages, loadingMore]);

  const visibleList = accumulatedList.slice(0, visibleCount);

  return (
    <section id="cities" className="py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-semibold text-white mb-4">
          Explore cities
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto mb-6">
          Discover hidden gems with trusted local guides
        </p>
        <CityCard cities={visibleList} />
        {hasMorePages && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handleShowMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-lg bg-nightsky text-white font-medium hover:bg-nightsky/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? "Loading…" : "Show more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
