import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

/** Dashboard link for Flags Explorer / Vercel UI */
const CARDS_WIDGET_FLAG_ORIGIN =
  "https://vercel.com/tribewws-projects/localcitywalks.v1/flag/cards-widget-update";

/**
 * Gates new listing card UI (price-list headline, ratings), tour-page booking widget,
 * and native checkout (phase two — same flow as the widget).
 * Managed in Vercel Flags (`cards-widget-update`); `vercel flags inspect cards-widget-update` for variants.
 */
export const cardsWidgetUpdate = flag<boolean>({
  key: "cards-widget-update",
  description: "Updating the booking widget, cards UI, and native checkout",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  origin: CARDS_WIDGET_FLAG_ORIGIN,
  adapter: vercelAdapter(),
});
