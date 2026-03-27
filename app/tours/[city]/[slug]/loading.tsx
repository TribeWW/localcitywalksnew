/**
 * Renders a page-level loading skeleton used while a tour detail page is loading.
 *
 * The skeleton includes a header-like set of shimmer bars and a large content placeholder.
 *
 * @returns A JSX element representing the loading skeleton UI
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-pearlgray">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 xl:px-0 py-10">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-24 rounded bg-white/80" />
          <div className="h-10 w-80 max-w-full rounded bg-white/80" />
          <div className="h-4 w-40 rounded bg-white/80" />
        </div>
        <div className="h-[260px] w-full rounded-xl bg-white/80 shadow-sm md:h-[380px]" />
      </div>
    </main>
  );
}
