import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "Page not found - LocalCityWalks",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-nightsky">
      <Navbar variant="minimal" />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-8 md:py-20">
        <div className="flex w-full max-w-[600px] flex-col items-center text-center">
          <Image
            src="/404-traveller.svg"
            alt="A confused traveller holding two shoes"
            width={360}
            height={360}
            className="mb-6 h-auto w-full max-w-[200px] md:mb-10 md:max-w-[360px]"
            priority
          />

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground md:mb-4">
            404 — Page not found
          </p>

          <h1 className="mb-3 text-2xl font-bold leading-tight text-watermelon md:mb-4 md:text-4xl">
            Hmm, these shoes were made for walking…
          </h1>

          <p className="mx-auto mb-8 max-w-md text-base text-muted-foreground md:mb-10 md:text-lg">
            …but this page doesn&apos;t seem to go anywhere.
          </p>

          <div className="flex w-full max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
            <Link
              className="btn-default min-h-[44px] w-full bg-tangerine text-white hover:bg-grapefruit sm:w-auto sm:min-w-[10.5rem]"
              href="/"
            >
              Take me home
            </Link>

            <Link
              className="btn-default min-h-[44px] w-full border border-border bg-white text-nightsky hover:bg-gray-50 sm:w-auto sm:min-w-[10.5rem]"
              href="/explore"
            >
              Browse tours
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
