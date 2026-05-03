const DRAFT_PREFIX = /^drafts\./;

export type PublishedCityPayloadResult =
  | { ok: false; reason: "invalid-draft-id" }
  | {
      ok: true;
      draftId: string;
      publishedId: string;
      payload: Record<string, unknown>;
    };

/**
 * Builds the published `city` document body and ids from a draft Sanity document.
 * Strips revision timestamps so `createOrReplace` accepts the payload.
 */
export function buildPublishedCityPayloadFromDraft(doc: {
  _id: string;
  [key: string]: unknown;
}): PublishedCityPayloadResult {
  const draftId = doc._id;
  const publishedId = draftId.replace(DRAFT_PREFIX, "");
  if (!publishedId || publishedId === draftId) {
    return { ok: false, reason: "invalid-draft-id" };
  }

  const payload: Record<string, unknown> = { ...doc };
  delete payload._rev;
  delete payload._createdAt;
  delete payload._updatedAt;
  payload._id = publishedId;
  payload._type = "city";

  return { ok: true, draftId, publishedId, payload };
}
