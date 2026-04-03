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
