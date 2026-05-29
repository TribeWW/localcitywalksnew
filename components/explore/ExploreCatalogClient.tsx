"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import CityCard from "@/components/cards/CityCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExploreCatalogPage } from "@/lib/actions/tour.actions";
import { enrichListingCardsIfFlagged } from "@/lib/city-cards/enrich-listing-cards-if-flagged";
import { Skeleton } from "@/components/ui/skeleton";
import { CityCardData } from "@/types/bokun";
import { Check, ChevronDown, X } from "lucide-react";

const PAGE_SIZE = 20;

interface CountryOption {
  countryCode: string;
  country: string;
}

interface ExploreCatalogClientProps {
  initialData: CityCardData[];
  totalHits: number;
  initialSortAscending: boolean;
  completeCountryList: CountryOption[];
  /** Vercel Flag `cards-widget-update` — forwarded to `CityCard` for gated UI. */
  cardsWidgetUpdate?: boolean;
}

/**
 * Render an explore-catalog UI that displays city cards with title sorting, country filtering, and incremental "Show more" pagination.
 *
 * Renders a sticky country tab bar (including "All"), title sorting controls (A–Z / Z–A), a grid of city cards or loading/empty states, and a "Show more" button to load or reveal additional results.
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
  completeCountryList,
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
  const [mobileCountryOpen, setMobileCountryOpen] = useState(false);
  const mobileCountryRef = useRef<HTMLDivElement | null>(null);

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
        selectedCountryCodes,
        sortAscending,
      );
      if (result.success && result.data) {
        const enriched = await enrichListingCardsIfFlagged(
          result.data,
          cardsWidgetUpdate,
        );
        setAccumulatedList((prev) => [...prev, ...enriched]);
        if (result.totalHits != null) setTotalHitsView(result.totalHits);
        setVisibleCount((prev) => prev + enriched.length);
        setCurrentPage(nextPage);
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
    selectedCountryCodes,
    sortAscending,
    cardsWidgetUpdate,
  ]);

  const showMoreVisible =
    hasMoreFilteredToShow || (hasMorePages && accumulatedList.length > 0);

  const refreshRequestId = useRef(0);

  const selectCountry = useCallback(
    async (countryCodes: string[]) => {
      const reqId = ++refreshRequestId.current;
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
          setSelectedCountryCodes(countryCodes);
          setAccumulatedList(enriched);
          setVisibleCount(PAGE_SIZE);
          setCurrentPage(1);
          if (result.totalHits != null) setTotalHitsView(result.totalHits);
        }
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
  const selectedCountryLabel = "Country";

  const toggleMobileCountry = useCallback(
    async (countryCode: string) => {
      const isSelected = selectedCountryCodes.includes(countryCode);
      const nextCountryCodes = isSelected
        ? selectedCountryCodes.filter((code) => code !== countryCode)
        : [...selectedCountryCodes, countryCode];
      await selectCountry(nextCountryCodes);
    },
    [selectCountry, selectedCountryCodes],
  );

  useEffect(() => {
    if (!mobileCountryOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!mobileCountryRef.current) return;
      const target = event.target as Node;
      if (!mobileCountryRef.current.contains(target)) {
        setMobileCountryOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileCountryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileCountryOpen]);

  return (
    <>
      <div className="sticky top-0 z-30 w-full border-b border-[#D3CED2] bg-white">
        <div className="mx-auto flex w-full max-w-[1140px] flex-wrap items-center gap-3 px-6 lg:flex-nowrap lg:justify-between lg:gap-4 lg:px-0">
          <div
            role="tablist"
            aria-label="Filter by country"
            className="hidden min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              role="tab"
              aria-current={
                selectedCountryCodes.length === 0 ? "true" : undefined
              }
              aria-selected={selectedCountryCodes.length === 0}
              onClick={() => void selectCountry([])}
              disabled={controlsDisabled}
              className={`-mb-px border-b px-5 py-4 text-sm transition-colors duration-150 ${
                selectedCountryCodes.length === 0
                  ? "border-[#FF5500] font-semibold text-slate-900"
                  : "border-transparent font-normal text-[#6A6A6A] hover:text-slate-900"
              } disabled:opacity-50`}
            >
              All
            </button>
            {completeCountryList.map(({ countryCode, country }) => (
              <button
                key={countryCode || "unknown"}
                type="button"
                role="tab"
                aria-current={
                  selectedCountryCodes.includes(countryCode)
                    ? "true"
                    : undefined
                }
                aria-selected={selectedCountryCodes.includes(countryCode)}
                onClick={() => void selectCountry([countryCode])}
                disabled={controlsDisabled}
                className={`-mb-px border-b px-5 py-4 text-sm transition-colors duration-150 ${
                  selectedCountryCodes.includes(countryCode)
                    ? "border-[#FF5500] font-semibold text-slate-900"
                    : "border-transparent font-normal text-[#6A6A6A] hover:text-slate-900"
                } disabled:opacity-50`}
              >
                {country}
              </button>
            ))}
          </div>

          <div
            ref={mobileCountryRef}
            className="relative flex min-w-0 flex-1 items-center py-2 lg:hidden"
          >
            <button
              type="button"
              onClick={() => setMobileCountryOpen((open) => !open)}
              disabled={controlsDisabled}
              aria-expanded={mobileCountryOpen}
              aria-controls="mobile-country-menu"
              className="flex h-10 w-full items-center justify-between rounded-sm border border-input bg-white px-3 text-left text-sm disabled:opacity-50"
            >
              <span className="truncate">{selectedCountryLabel}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#6A6A6A] transition-transform ${
                  mobileCountryOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
            {mobileCountryOpen && (
              <div
                id="mobile-country-menu"
                className="absolute left-0 top-12 z-40 w-full rounded-sm border border-border bg-white p-2 shadow-lg"
              >
                <div className="max-h-60 overflow-y-auto">
                  {completeCountryList.map(({ countryCode, country }) => {
                    const isSelected =
                      selectedCountryCodes.includes(countryCode);
                    return (
                      <button
                        key={`mobile-${countryCode || "unknown"}`}
                        type="button"
                        onClick={() => void toggleMobileCountry(countryCode)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
                        aria-label={`Country option ${country}`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                              isSelected
                                ? "border-[#0F172A] bg-[#0F172A]"
                                : "border-[#CBD5E1] bg-white"
                            }`}
                            aria-hidden
                          >
                            {isSelected ? (
                              <Check
                                className="h-3 w-3 text-white"
                                aria-hidden
                              />
                            ) : null}
                          </span>
                          <span>{country}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedCountryCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void selectCountry([])}
                    className="mt-2 w-full border-t border-border px-2 pt-3 pb-1 text-left text-sm font-medium text-[#6A6A6A] hover:text-[#0F172A]"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          <label className="flex min-w-0 flex-1 shrink-0 items-center gap-2 py-2 lg:w-auto lg:flex-none">
            <span className="shrink-0 text-sm text-muted-foreground">Sort</span>
            <Select
              value={sortAscending ? "asc" : "desc"}
              onValueChange={(v) => void applySortOrder(v === "asc")}
              disabled={controlsDisabled}
            >
              <SelectTrigger
                className="w-full lg:w-[170px]"
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
        </div>
      </div>

      <section id="explore-catalog" className="py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-0">
          {selectedCountryCodes.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
              {selectedCountryCodes.map((countryCode) => {
                const label =
                  completeCountryList.find((c) => c.countryCode === countryCode)
                    ?.country ?? countryCode;
                return (
                  <button
                    key={`chip-${countryCode}`}
                    type="button"
                    onClick={() => void toggleMobileCountry(countryCode)}
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
          )}
          <div className="px-0 ">
            {loadingFilter ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center ">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm overflow-hidden w-full border border-border"
                  >
                    <Skeleton className="h-48 w-full rounded-none" />
                    <div className=" space-y-4">
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
                <div className="text-sm text-[#6A6A6A]">
                  <span>
                    <span>
                      {totalHitsView} {totalHitsView === 1 ? "tour" : "tours"}
                    </span>{" "}
                    found
                  </span>
                </div>
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
