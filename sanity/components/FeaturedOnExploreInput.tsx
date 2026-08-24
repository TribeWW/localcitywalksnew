"use client";

import { useEffect, useState } from "react";
import { Stack, Text } from "@sanity/ui";
import { useClient, type BooleanInputProps } from "sanity";
import { apiVersion } from "../env";
import {
  FEATURED_EXPLORE_MAX,
  FEATURED_EXPLORE_TOTAL_COUNT_QUERY,
  formatFeaturedExploreSlotsLabel,
} from "../schemaTypes/country.helpers";

/**
 * Studio boolean input for `featuredOnExplore` with live slot usage.
 *
 * Renders the default boolean control plus a line such as
 * "Featured slots: 3 of 5 used (2 remaining)" so editors know capacity
 * before enabling the flag. Fail-open: if the count fetch fails, shows a
 * short fallback and still allows toggling (cap validation remains authoritative).
 *
 * @param props - Standard Sanity `BooleanInputProps` for the featured field
 * @returns Default boolean input plus featured-slot usage text
 */
export default function FeaturedOnExploreInput(props: BooleanInputProps) {
  const client = useClient({ apiVersion });
  const [slotsLabel, setSlotsLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    client
      .fetch<number>(FEATURED_EXPLORE_TOTAL_COUNT_QUERY)
      .then((used) => {
        if (!cancelled) {
          setSlotsLabel(
            formatFeaturedExploreSlotsLabel(used, FEATURED_EXPLORE_MAX),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlotsLabel("Could not load featured slot count");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      {slotsLabel ? (
        <Text size={1} muted>
          {slotsLabel}
        </Text>
      ) : null}
    </Stack>
  );
}
