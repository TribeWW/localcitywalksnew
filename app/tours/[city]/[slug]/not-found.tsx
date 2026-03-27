import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Render a full-page "Tour not found" UI with actions to browse available tours or contact support.
 *
 * Displays a heading, a brief explanatory paragraph, and two call-to-action buttons linking to `/#cities` and `/#contact`.
 *
 * @returns A JSX element representing the not-found page UI
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-pearlgray">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8 xl:px-0 py-16">
        <h1 className="text-3xl font-semibold text-nightsky">
          Tour not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          This tour may no longer be available, or the link may be incorrect.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="bg-nightsky hover:bg-nightsky/90">
            <Link href="/#cities">Browse tours</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/#contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
