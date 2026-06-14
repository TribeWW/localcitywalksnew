import "@testing-library/jest-dom/vitest";

/** Radix primitives (Checkbox, Select) require ResizeObserver in jsdom. */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

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
