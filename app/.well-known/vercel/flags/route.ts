import { createFlagsDiscoveryEndpoint } from "flags/next";
import { getProviderData } from "@flags-sdk/vercel";
import type { NextRequest } from "next/server";
import * as flags from "../../../../flags";

export const GET = createFlagsDiscoveryEndpoint(
  async (request: NextRequest) => {
    void request;
    return getProviderData(flags);
  },
);
