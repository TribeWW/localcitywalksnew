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
 * Evaluate with `await archivePage()` in a Server Component, route handler, or middleware.
 *
 * @see https://vercel.com/tribewws-projects/localcitywalks.v1/flag/archive-page
 */
export const archivePage = flag<boolean>({
  key: "archive-page",
  adapter: vercelAdapter(),
  description: "Enables the /explore archive page and curated home spotlight",
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  defaultValue: false,
});
