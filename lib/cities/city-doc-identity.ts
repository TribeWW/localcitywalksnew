/** Sanity draft document id prefix. */
export const DRAFT_PREFIX = "drafts.";

/** Published + draft `_id` pair for the same Sanity city identity. */
export function cityDocIdentityIds(rawId: string): {
  publishedId: string;
  draftId: string;
} {
  const publishedId = rawId.startsWith(DRAFT_PREFIX)
    ? rawId.slice(DRAFT_PREFIX.length)
    : rawId;
  return {
    publishedId,
    draftId: rawId.startsWith(DRAFT_PREFIX)
      ? rawId
      : `${DRAFT_PREFIX}${publishedId}`,
  };
}

/** Docs in `allDocs` that share the selected city's published/draft identity. */
export function docsInCityIdentityGroup<T extends { _id: string }>(
  allDocs: T[],
  rawId: string,
): T[] {
  const { publishedId, draftId } = cityDocIdentityIds(rawId);
  return allDocs.filter((doc) => doc._id === publishedId || doc._id === draftId);
}
