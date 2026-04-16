import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

/**
 * Vercel Flags — `reviews` (boolean: Off / On).
 * Kind, variants, and description match `vercel flags inspect reviews` for project `localcitywalks.v1`.
 *
 * Requires `FLAGS` and `FLAGS_SECRET` — run `vercel env pull` after linking the project.
 * Evaluate with `await reviews()` in a Server Component, route handler, or middleware.
 *
 * @see https://vercel.com/tribewws-projects/localcitywalks.v1/flag/reviews
 */
export const reviews = flag<boolean>({
  key: "reviews",
  adapter: vercelAdapter(),
  description: "Enables reviews in localcitywalks",
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  defaultValue: false,
});

/**
 * Vercel Flags — `archive-page` (boolean: Off / On).
 * Kind and variants match `vercel flags inspect archive-page` for project `localcitywalks.v1`.
 *
 * When on: enables `/explore` and the home page shows **HomeSpotlight** (Sanity-curated grid).
 * When off: home uses the legacy **Cities** block (Bokun search); `/explore` is not served
 * (see `app/explore/page.tsx`).
 *
 * Evaluate with `await archivePage()` in a Server Component, route handler, or middleware.
 *
 * @see https://vercel.com/tribewws-projects/localcitywalks.v1/flag/archive-page
 */
export const archivePage = flag<boolean>({
  key: "archive-page",
  adapter: vercelAdapter(),
  description:
    "Enables /explore and curated HomeSpotlight on home (legacy Cities when off)",
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  defaultValue: false,
});
