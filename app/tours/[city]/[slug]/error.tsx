"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TourPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tour page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-pearl-gray">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 md:px-8 xl:px-0">
        <h1 className="text-3xl font-semibold text-nightsky">
          We could not load this tour right now
        </h1>
        <p className="mt-3 text-muted-foreground">
          Please try again in a moment. If the issue continues, contact us and
          we will help you plan your private tour.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="bg-nightsky hover:bg-nightsky/90"
            onClick={() => reset()}
          >
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/#contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
