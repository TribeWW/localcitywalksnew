import "@testing-library/jest-dom/vitest";

/**
 * Sanity `env.ts` asserts these at import time. Vitest should not require a real
 * `.env.local` for tests that only mock the client.
 */
if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
  process.env.NEXT_PUBLIC_SANITY_DATASET = "test";
}
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "test-project";
}
