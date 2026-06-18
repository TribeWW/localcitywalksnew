/**
 * Best-effort embed of Vercel Flags definitions for local webpack builds.
 *
 * Vercel injects `@vercel/flags-definitions` during deploy. When `FLAGS` is
 * valid locally, this mirrors that behavior. Failures are non-fatal — builds
 * still succeed and flags resolve via the live SDK at runtime.
 */

import { prepareFlagsDefinitions } from "@vercel/prepare-flags-definitions";

try {
  const result = await prepareFlagsDefinitions({
    cwd: process.cwd(),
    env: process.env,
    userAgentSuffix: "localcitywalks/prebuild",
  });

  if (result.created) {
    console.log(
      `[flags] Bundled definitions for ${result.entryCount} SDK key(s)`,
    );
  } else {
    console.log(`[flags] Skipped embedded definitions: ${result.reason}`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[flags] Could not embed definitions (non-fatal): ${message}`);
}
