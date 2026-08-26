"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import CityCard from "@/components/cards/CityCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExploreCatalogPage } from "@/lib/explore/tour.actions";
import { enrichListingCardsIfFlagged } from "@/lib/city-cards/enrich-listing-cards-if-flagged";
import { Skeleton } from "@/components/ui/skeleton";
import { CityCardData } from "@/types/bokun";
import { X } from "lucide-react";
import ExploreCountryPicker, {
  type ExploreCountryOption,
} from "@/components/explore/ExploreCountryPicker";

const PAGE_SIZE = 20;

type CountryOption = ExploreCountryOption;

interface ExploreCatalogClientProps {
  initialData: CityCardData[];
  totalHits: number;
  initialSortAscending: boolean;
  completeCountryList: CountryOption[];
  /**
   * Featured countries for desktop quick filters (Sanity ∩ catalog, max 5).
   * Empty list omits the divider and quick-filter group on the sticky bar.
   */
  featuredCountries?: CountryOption[];
  /** Vercel Flag `cards-widget-update` — forwarded to `CityCard` for gated UI. */
  cardsWidgetUpdate?: boolean;
}

/**
 * Render an explore-catalog UI that displays city cards with title sorting,
 * country filtering, and incremental "Show more" pagination.
 *
 * Sticky filter bar: shared country picker and optional desktop quick filters.
 * Sort is desktop-only in the catalog meta row (`N tours found` → gap → chips →
 * Sort right-aligned) and is hidden on mobile. Quick filters always reset to a
 * single country; the picker remains multi-select.
 *
 * @param initialData - Initial page of city card data shown when the component mounts
 * @param totalHits - Total number of available results used to determine whether more pages exist
 * @param initialSortAscending - Whether the initial title sort order is ascending (A–Z)
 * @param completeCountryList - Full catalog country options for the picker
 * @param featuredCountries - Optional featured countries for desktop quick filters (default `[]`)
 * @param cardsWidgetUpdate - When true, enrich listing cards via the cards-widget flag path
 * @returns The ExploreCatalogClient React element
 */
export default function ExploreCatalogClient({
  initialData,
  totalHits,
  initialSortAscending,
  completeCountryList,
  featuredCountries = [],
  cardsWidgetUpdate = false,
}: ExploreCatalogClientProps) {
  const [accumulatedList, setAccumulatedList] =
    useState<CityCardData[]>(initialData);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHitsView, setTotalHitsView] = useState(totalHits);
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>(
    [],
  );
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [sortAscending, setSortAscending] = useState(initialSortAscending);
  const refreshRequestId = useRef(0);

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
    const reqId = ++refreshRequestId.current;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getExploreCatalogPage(
        nextPage,
        selectedCountryCodes,
        sortAscending,
      );
      if (reqId !== refreshRequestId.current) return;
      if (result.success && result.data) {
        const enriched = await enrichListingCardsIfFlagged(
          result.data,
          cardsWidgetUpdate,
        );
        if (reqId !== refreshRequestId.current) return;
        setAccumulatedList((prev) => [...prev, ...enriched]);
        if (result.totalHits != null) setTotalHitsView(result.totalHits);
        setVisibleCount((prev) => prev + enriched.length);
        setCurrentPage(nextPage);
      }
    } finally {
      if (reqId === refreshRequestId.current) setLoadingMore(false);
    }
  }, [
    currentPage,
    hasMorePages,
    hasMoreFilteredToShow,
    loadingMore,
    accumulatedList.length,
    selectedCountryCodes,
    sortAscending,
    cardsWidgetUpdate,
  ]);

  const showMoreVisible =
    hasMoreFilteredToShow || (hasMorePages && accumulatedList.length > 0);

  const selectCountry = useCallback(
    async (countryCodes: string[]) => {
      const reqId = ++refreshRequestId.current;
      // Optimistic UI: update chips / picker selection immediately so Clear all
      // and toggles don't leave stale chips over a loading grid.
      let previousCodes: string[] = [];
      setSelectedCountryCodes((prev) => {
        previousCodes = prev;
        return countryCodes;
      });
      setLoadingFilter(true);
      try {
        const result = await getExploreCatalogPage(
          1,
          countryCodes,
          sortAscending,
        );
        if (reqId !== refreshRequestId.current) return;
        if (result.success && result.data) {
          const enriched = await enrichListingCardsIfFlagged(
            result.data,
            cardsWidgetUpdate,
          );
          if (reqId !== refreshRequestId.current) return;
          setAccumulatedList(enriched);
          setVisibleCount(PAGE_SIZE);
          setCurrentPage(1);
          if (result.totalHits != null) setTotalHitsView(result.totalHits);
        } else {
          setSelectedCountryCodes(previousCodes);
        }
      } catch {
        setSelectedCountryCodes(previousCodes);
      } finally {
        if (reqId === refreshRequestId.current) setLoadingFilter(false);
      }
    },
    [sortAscending, cardsWidgetUpdate],
  );

  const applySortOrder = useCallback(
    async (asc: boolean) => {
      const reqId = ++refreshRequestId.current;
      setLoadingFilter(true);
      try {
        const result = await getExploreCatalogPage(
          1,
          selectedCountryCodes,
          asc,
        );
        if (reqId !== refreshRequestId.current) return;
        if (result.success && result.data) {
          const enriched = await enrichListingCardsIfFlagged(
            result.data,
            cardsWidgetUpdate,
          );
          if (reqId !== refreshRequestId.current) return;
          setSortAscending(asc);
          setAccumulatedList(enriched);
          setVisibleCount(PAGE_SIZE);
          setCurrentPage(1);
          if (result.totalHits != null) setTotalHitsView(result.totalHits);
        }
      } finally {
        if (reqId === refreshRequestId.current) setLoadingFilter(false);
      }
    },
    [selectedCountryCodes, cardsWidgetUpdate],
  );

  const showEmptyForCountry =
    selectedCountryCodes.length > 0 &&
    accumulatedList.length === 0 &&
    !loadingFilter;
  const controlsDisabled = loadingFilter || loadingMore;
  const showResultsMeta = !loadingFilter && !showEmptyForCountry;
  const showMetaRow = selectedCountryCodes.length > 0 || showResultsMeta;

  const toggleCountry = useCallback(
    async (countryCode: string) => {
      const isSelected = selectedCountryCodes.includes(countryCode);
      const nextCountryCodes = isSelected
        ? selectedCountryCodes.filter((code) => code !== countryCode)
        : [...selectedCountryCodes, countryCode];
      await selectCountry(nextCountryCodes);
    },
    [selectCountry, selectedCountryCodes],
  );

  /**
   * Desktop-only Sort control for the catalog meta row.
   *
   * @param className - Layout classes for the label wrapper
   */
  const sortControl = (className: string) => (
    <label className={className}>
      <span className="shrink-0 text-sm text-muted-foreground">Sort:</span>
      <Select
        value={sortAscending ? "asc" : "desc"}
        onValueChange={(v) => void applySortOrder(v === "asc")}
        disabled={controlsDisabled}
      >
        <SelectTrigger
          className="px-0 text-[#6A6A6A] border-0 shadow-none"
          disabled={controlsDisabled}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Title A–Z</SelectItem>
          <SelectItem value="desc">Title Z–A</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );

  return (
    <>
      <div
        className="sticky top-0 z-30 w-full border-b border-[#D3CED2] bg-white"
        data-testid="explore-filter-bar"
        data-featured-count={featuredCountries.length}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 lg:flex-nowrap lg:gap-4 lg:px-0">
          <ExploreCountryPicker
            countries={completeCountryList}
            selectedCountryCodes={selectedCountryCodes}
            disabled={controlsDisabled}
            className="relative min-w-0 flex-1 lg:flex-none"
            menuId="explore-country-menu"
            onToggleCountry={(code) => void toggleCountry(code)}
            onClear={() => void selectCountry([])}
          />

          {featuredCountries.length > 0 ? (
            <>
              <div
                aria-hidden
                className="hidden h-6 w-px shrink-0 bg-border lg:block"
              />
              <div
                role="group"
                aria-label="Filter by country"
                className="hidden min-w-0 items-center gap-1 lg:flex"
              >
                {featuredCountries.map(({ countryCode, country }) => (
                  <button
                    key={`quick-${countryCode || "unknown"}`}
                    type="button"
                    onClick={() => void selectCountry([countryCode])}
                    disabled={controlsDisabled}
                    className="px-3 py-2 text-sm font-normal text-[#6A6A6A] transition-colors duration-150 hover:text-[#0F172A] disabled:opacity-50"
                  >
                    {country}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <section id="explore-catalog" className="py-6">
        <div className="mx-auto max-w-6xl px-6 md:px-8 lg:px-0">
          <div
            data-testid="explore-catalog-meta"
            className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${
              showMetaRow ? "" : "hidden lg:flex"
            }`}
          >
            {showResultsMeta ? (
              <div
                className="order-2 text-sm text-[#6A6A6A] lg:order-1"
                data-testid="explore-tours-found"
              >
                <span>
                  {totalHitsView} {totalHitsView === 1 ? "tour" : "tours"} found
                </span>
              </div>
            ) : null}

            {selectedCountryCodes.length > 0 ? (
              <div
                className="order-1 flex flex-wrap items-center gap-2 lg:order-2"
                data-testid="explore-country-chips"
              >
                {selectedCountryCodes.map((countryCode) => {
                  const label =
                    completeCountryList.find(
                      (c) => c.countryCode === countryCode,
                    )?.country ?? countryCode;
                  return (
                    <button
                      key={`chip-${countryCode}`}
                      type="button"
                      onClick={() => void toggleCountry(countryCode)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-[#F8FAFC] px-3 py-1.5 text-sm font-medium text-[#334155]"
                      aria-label={`${label} remove`}
                    >
                      {label}
                      <X className="h-3.5 w-3.5 text-[#6A6A6A]" aria-hidden />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => void selectCountry([])}
                  className="text-sm text-[#6A6A6A] underline underline-offset-2 hover:text-[#0F172A]"
                  aria-label="Clear all countries"
                >
                  Clear all
                </button>
              </div>
            ) : null}

            <div className="order-3 ml-auto hidden min-w-0 shrink-0 lg:block">
              {sortControl("flex items-center gap-2 py-0")}
            </div>
          </div>

          <div className="px-0">
            {loadingFilter ? (
              <div className="grid grid-cols-1 justify-items-center gap-6 py-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                  >
                    <Skeleton className="h-48 w-full rounded-none" />
                    <div className="space-y-4">
                      <Skeleton className="mx-auto h-6 w-3/4" />
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
                <CityCard
                  cities={visibleList}
                  noHorizontalPadding
                  cardsWidgetUpdate={cardsWidgetUpdate}
                />
                {showMoreVisible && (
                  <div className="mt-16 text-center">
                    <button
                      type="button"
                      onClick={() => void handleShowMore()}
                      disabled={loadingMore}
                      className="inline-flex h-auto min-h-0 items-center justify-center rounded-[8px] border-[1.5px] border-[#0F172A] bg-white px-6 py-4 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#0F172A] hover:text-white focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingMore ? "Loading…" : "Load more tours"}
                    </button>
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
