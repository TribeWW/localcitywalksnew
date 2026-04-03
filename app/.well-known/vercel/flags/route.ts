import { getProviderData } from "@flags-sdk/vercel";
import { createFlagsDiscoveryEndpoint } from "flags/next";
import * as appFlags from "@/lib/flags";

/**
 * Flags Explorer discovery endpoint. Requires `FLAGS_SECRET` for authenticated access.
 */
export const GET = createFlagsDiscoveryEndpoint(async () => getProviderData(appFlags));
