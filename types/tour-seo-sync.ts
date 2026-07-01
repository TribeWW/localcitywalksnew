/**
 * Result of auto-provisioning Tour SEO shell documents from a Bokun product batch.
 */
export type TourSeoSyncResult = {
  /** Bokun product ids for newly created shell documents */
  created: string[];
  /** Bokun product ids that already had a Tour SEO document */
  existing: string[];
  errors: Array<{
    type: "tourSeo";
    identifier: string;
    error: string;
  }>;
};
