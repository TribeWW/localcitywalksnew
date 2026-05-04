import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

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
