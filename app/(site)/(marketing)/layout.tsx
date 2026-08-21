import type { ReactNode } from "react";
import { cookies } from "next/headers";

import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { PromoBanner } from "@/components/shared/PromoBanner";
import {
  isPromoDismissedForCampaign,
  PROMO_DISMISS_COOKIE_NAME,
} from "@/lib/promo-banner/dismiss-cookie";
import { getActivePromoBanner } from "@/lib/promo-banner/get-active-promo-banner";

/**
 * Full browse chrome for marketing routes (home, explore, tours).
 *
 * Loads the active promo (flag + Sanity schedule) and renders {@link PromoBanner}
 * above the Navbar unless this session dismissed that campaign. While the promo
 * is shown, promo + nav share a sticky wrapper; after dismiss (or no offer),
 * Navbar uses its normal sticky behavior again.
 */
export default async function MarketingGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const now = new Date();
  const [cookieStore, activePromo] = await Promise.all([
    cookies(),
    getActivePromoBanner(now),
  ]);

  const dismissCookie = cookieStore.get(PROMO_DISMISS_COOKIE_NAME)?.value;
  const showPromo =
    activePromo != null &&
    !isPromoDismissedForCampaign(dismissCookie, activePromo.campaignId);

  return (
    <>
      {showPromo && activePromo ? (
        <div className="sticky top-0 z-40">
          <PromoBanner
            headline={activePromo.headline}
            promoCode={activePromo.promoCode}
            endsAt={activePromo.endsAt}
            campaignId={activePromo.campaignId}
            initialNowIso={now.toISOString()}
          />
          <Navbar sticky={false} />
        </div>
      ) : (
        <Navbar />
      )}
      {children}
      <Footer />
    </>
  );
}
