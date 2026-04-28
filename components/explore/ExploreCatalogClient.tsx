"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import CityCard from "@/components/cards/CityCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExploreCatalogPage } from "@/lib/actions/tour.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { CityCardData } from "@/types/bokun";

const PAGE_SIZE = 20;

interface CountryOption {
  countryCode: string;
  country: string;
}

interface ExploreCatalogClientProps {
  initialData: CityCardData[];
  totalHits: number;
  initialSortAscending: boolean;
}

/**
 * Render an explore-catalog UI that displays city cards with title sorting, country filtering, and incremental "Show more" pagination.
 *
 * Renders controls for sorting (A–Z / Z–A), a dialog to filter by country (including "All countries"), a grid of city cards or loading/empty states, and a "Show more" button to load or reveal additional results.
 *
 * @param initialData - Initial page of city card data shown when the component mounts
 * @param totalHits - Total number of available results used to determine whether more pages exist
 * @param initialSortAscending - Whether the initial title sort order is ascending (A–Z)
 * @returns The ExploreCatalogClient React element
 */
export default function ExploreCatalogClient({
  initialData,
  totalHits,
  initialSortAscending,
}: ExploreCatalogClientProps) {
  const [accumulatedList, setAccumulatedList] =
    useState<CityCardData[]>(initialData);
  const [allProductsForCountryList, setAllProductsForCountryList] =
    useState<CityCardData[]>(initialData);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHitsView, setTotalHitsView] = useState(totalHits);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null,
  );
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [sortAscending, setSortAscending] = useState(initialSortAscending);

  const uniqueCountries = useMemo((): CountryOption[] => {
    const byCode = new Map<string, string>();
    for (const c of allProductsForCountryList) {
      const code = c.countryCode?.trim();
      if (!code) continue; // keep "All countries" as the only unfiltered choice
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
      const result = await getExploreCatalogPage(
        nextPage,
        selectedCountryCode ?? undefined,
        sortAscending,
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
    sortAscending,
  ]);

  const showMoreVisible =
    hasMoreFilteredToShow || (hasMorePages && accumulatedList.length > 0);

  const refreshRequestId = useRef(0);

  const selectCountry = useCallback(
    async (countryCode: string | null) => {
      const reqId = ++refreshRequestId.current;
      setLoadingFilter(true);
      try {
        const result = await getExploreCatalogPage(
          1,
          countryCode ?? undefined,
          sortAscending,
        );
        if (reqId !== refreshRequestId.current) return;
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
        if (reqId === refreshRequestId.current) setLoadingFilter(false);
      }
    },
    [sortAscending],
  );

  const applySortOrder = useCallback(
    async (asc: boolean) => {
      const reqId = ++refreshRequestId.current;
      setLoadingFilter(true);
      try {
        const result = await getExploreCatalogPage(
          1,
          selectedCountryCode ?? undefined,
          asc,
        );
        if (reqId !== refreshRequestId.current) return;
        if (result.success && result.data) {
          setSortAscending(asc);
          setAccumulatedList(result.data);
          setVisibleCount(PAGE_SIZE);
          setCurrentPage(1);
          if (result.totalHits != null) setTotalHitsView(result.totalHits);
          if (selectedCountryCode === null) {
            setAllProductsForCountryList(result.data);
          }
        }
      } finally {
        if (reqId === refreshRequestId.current) setLoadingFilter(false);
      }
    },
    [selectedCountryCode],
  );

  const showEmptyForCountry =
    selectedCountryCode !== null &&
    accumulatedList.length === 0 &&
    !loadingFilter;

  return (
    <>
      <div className="sticky top-0 z-30 w-full border-b border-[#D3CED2] bg-white">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4 px-6">
          <div
            role="tablist"
            aria-label="Filter by country"
            className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              role="tab"
              aria-current={selectedCountryCode === null ? "true" : undefined}
              aria-selected={selectedCountryCode === null}
              onClick={() => void selectCountry(null)}
              disabled={loadingFilter}
              className={`-mb-px border-b px-5 py-4 text-sm transition-colors duration-150 ${
                selectedCountryCode === null
                  ? "border-[#FF5500] font-semibold text-slate-900"
                  : "border-transparent font-normal text-[#6A6A6A] hover:text-slate-900"
              } disabled:opacity-50`}
            >
              All
            </button>
            {uniqueCountries.map(({ countryCode, country }) => (
              <button
                key={countryCode || "unknown"}
                type="button"
                role="tab"
                aria-current={
                  selectedCountryCode === countryCode ? "true" : undefined
                }
                aria-selected={selectedCountryCode === countryCode}
                onClick={() => void selectCountry(countryCode)}
                disabled={loadingFilter}
                className={`-mb-px border-b px-5 py-4 text-sm transition-colors duration-150 ${
                  selectedCountryCode === countryCode
                    ? "border-[#FF5500] font-semibold text-slate-900"
                    : "border-transparent font-normal text-[#6A6A6A] hover:text-slate-900"
                } disabled:opacity-50`}
              >
                {country}
              </button>
            ))}
          </div>

          <label className="flex shrink-0 items-center gap-2 py-2">
            <span className="shrink-0 text-sm text-muted-foreground">Sort</span>
            <Select
              value={sortAscending ? "asc" : "desc"}
              onValueChange={(v) => void applySortOrder(v === "asc")}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Title A–Z</SelectItem>
                <SelectItem value="desc">Title Z–A</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      <section id="explore-catalog" className="py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8 xl:px-0">
        <div className="px-0 md:px-6">
          {loadingFilter ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center py-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm overflow-hidden w-full max-w-[250px] border border-border"
                >
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : showEmptyForCountry ? (
            <div className="text-center py-12 px-4 rounded-lg border border-border bg-muted/30 text-foreground">
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
                    variant="default"
                    onClick={() => void handleShowMore()}
                    disabled={loadingMore}
                    className="min-h-[44px] px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}
