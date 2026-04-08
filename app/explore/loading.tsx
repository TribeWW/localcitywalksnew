"use client";

/**
 * Displays the skeleton loading UI for the explore page.
 *
 * Renders animated placeholder elements representing a heading, a subheading, and a content area.
 *
 * @returns A React element containing the animated skeleton placeholders
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-muted" />
      <div className="mt-8 h-40 w-full animate-pulse rounded-lg bg-muted" />
    </main>
  );
}

