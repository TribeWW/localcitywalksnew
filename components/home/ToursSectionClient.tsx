"use client";

import React, { useState, useCallback, useMemo } from "react";
import CityCard from "@/components/cards/CityCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProductsPage } from "@/lib/actions/tour.actions";
import { CityCardData } from "@/types/bokun";
import { Flag } from "lucide-react";

const PAGE_SIZE = 20;

interface CountryOption {
  countryCode: string;
  country: string;
}

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
  /** Source for unique countries: all products we've loaded when in "all" mode; preserved when switching to filter */
  const [allProductsForCountryList, setAllProductsForCountryList] =
    useState<CityCardData[]>(initialData);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHitsView, setTotalHitsView] = useState(totalHits);
  /** Single select: null = show all; string = filter by that countryCode (server-side) */
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [loadingFilter, setLoadingFilter] = useState(false);

  const uniqueCountries = useMemo((): CountryOption[] => {
    const byCode = new Map<string, string>();
    for (const c of allProductsForCountryList) {
      const code = c.countryCode ?? "";
      if (!byCode.has(code)) {
        byCode.set(code, c.country ?? "Unknown");
      }
    }
    return Array.from(byCode.entries())
      .map(([countryCode, country]) => ({ countryCode, country }))
      .sort((a, b) => a.country.localeCompare(b.country));
  }, [allProductsForCountryList]);

  const visibleList = useMemo(
    () => accumulatedList.slice(0, visibleCount),
    [accumulatedList, visibleCount],
  );

  const hasMoreFilteredToShow = visibleCount < accumulatedList.length;
  const hasMorePages = accumulatedList.length < totalHitsView;

  const handleShowMore = useCallback(async () => {
    if (hasMoreFilteredToShow) {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_SIZE, accumulatedList.length),
      );
      return;
    }
    if (!hasMorePages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getProductsPage(
        nextPage,
        selectedCountryCode ?? undefined,
      );
      if (result.success && result.data) {
        setAccumulatedList((prev) => [...prev, ...result.data!]);
        if (result.totalHits != null) setTotalHitsView(result.totalHits);
        setVisibleCount((prev) => prev + result.data!.length);
        setCurrentPage(nextPage);
        if (selectedCountryCode === null) {
          setAllProductsForCountryList((prev) => [...prev, ...result.data!]);
        }
      }
    } finally {
      setLoadingMore(false);
    }
  }, [
    currentPage,
    hasMorePages,
    hasMoreFilteredToShow,
    loadingMore,
    accumulatedList.length,
    selectedCountryCode,
  ]);

  const showMoreVisible =
    hasMoreFilteredToShow || (hasMorePages && accumulatedList.length > 0);

  const selectCountry = useCallback(async (countryCode: string | null) => {
    setFilterOpen(false);
    setLoadingFilter(true);
    try {
      const result = await getProductsPage(1, countryCode ?? undefined);
      if (result.success && result.data) {
        setSelectedCountryCode(countryCode);
        setAccumulatedList(result.data);
        setVisibleCount(PAGE_SIZE);
        setCurrentPage(1);
        if (result.totalHits != null) setTotalHitsView(result.totalHits);
        if (countryCode === null) {
          setAllProductsForCountryList(result.data);
        }
      }
    } finally {
      setLoadingFilter(false);
    }
  }, []);

  const showEmptyForCountry =
    selectedCountryCode !== null &&
    accumulatedList.length === 0 &&
    !loadingFilter;

  return (
    <section id="cities" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Explore cities
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Discover hidden gems with trusted local guides
          </p>
        </div>

        <div className="px-6">
          <div className="flex justify-end mb-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFilterOpen(true)}
              className="gap-2 w-full md:w-auto bg-nightsky hover:bg-nightsky/90 text-white border-0"
              aria-label="Select country"
            >
              <Flag className="size-4" aria-hidden />
              Select country
            </Button>
          </div>

        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filter by country</DialogTitle>
              <DialogDescription>
                Choose one country to see tours from that country only.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto py-2">
              <button
                type="button"
                onClick={() => selectCountry(null)}
                disabled={loadingFilter}
                className={`flex items-center gap-3 w-full text-left rounded-md px-3 py-3 min-h-[44px] transition-colors ${
                  selectedCountryCode === null
                    ? "bg-nightsky/20 text-white font-medium"
                    : "hover:bg-muted/50 text-foreground"
                } disabled:opacity-50`}
              >
                <span className="text-sm">All countries</span>
              </button>
              {uniqueCountries.map(({ countryCode, country }) => (
                <button
                  key={countryCode || "unknown"}
                  type="button"
                  onClick={() => selectCountry(countryCode)}
                  disabled={loadingFilter}
                  className={`flex items-center gap-3 w-full text-left rounded-md px-3 py-3 min-h-[44px] transition-colors ${
                    selectedCountryCode === countryCode
                      ? "bg-nightsky/20 text-white font-medium"
                      : "hover:bg-muted/50 text-foreground"
                  } disabled:opacity-50`}
                >
                  <span className="text-sm">{country}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {loadingFilter ? (
          <div className="text-center py-12 text-white/80">Loading…</div>
        ) : showEmptyForCountry ? (
          <div className="text-center py-12 px-4 rounded-lg bg-white/5 text-white/90">
            <p className="text-lg font-medium">
              No tours found for this country in the current catalog.
            </p>
          </div>
        ) : (
          <>
            <CityCard cities={visibleList} noHorizontalPadding />
            {showMoreVisible && (
              <div className="mt-8 text-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="min-h-[44px] px-6 py-3 bg-nightsky hover:bg-nightsky/90 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? "Loading…" : "Show more"}
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </section>
  );
}
