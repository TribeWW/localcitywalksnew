import Link from "next/link";
import { Fragment } from "react";
import type { FooterCityLinkItem } from "@/lib/footer-city-link-rows";

/**
 * Sync presentational strip — no Sanity import (safe for Vitest without env).
 * Async `FooterCityLinks` loads data and renders this.
 */
export function FooterCityLinksView({ items }: { items: FooterCityLinkItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="w-full bg-white pt-8 pb-6">
      <div className="mx-auto max-w-[1140px] px-6">
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
          {items.map((city, i) => (
            <Fragment key={`${city.href}-${city.name}`}>
              <Link
                href={city.href}
                className="text-xs text-[#6A6A6A] no-underline transition-colors duration-150 hover:text-[#0F172A] hover:underline hover:underline-offset-[3px]"
              >
                {city.name}
              </Link>
              {i < items.length - 1 ? (
                <span className="text-xs text-[#D3CED2]" aria-hidden>
                  ·
                </span>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
