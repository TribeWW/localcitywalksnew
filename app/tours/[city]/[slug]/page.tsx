import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { stripAccents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TourRequestFormSection from "./tour-request-form-section";

function extractIdFromSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("-").filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  return /^\d+$/.test(last) ? last : null;
}

function slugifyForUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "unknown";
  const noAccents = stripAccents(trimmed);
  const withDashes = noAccents
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const lower = withDashes.toLowerCase();
  const slugSafe = lower.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return slugSafe.replace(/^-|-$/g, "") || "unknown";
}

function pickDerivedUrl(photo: unknown, preferred: string[]): string | null {
  const derived = (photo as { derived?: Array<{ name?: string; url?: string }> })
    ?.derived;
  if (!derived?.length) return null;

  for (const name of preferred) {
    const hit = derived.find((d) => d?.name === name && d?.url);
    if (hit?.url) return hit.url;
  }
  const any = derived.find((d) => d?.url);
  return any?.url ?? null;
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city, slug } = await params;

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const detail = await getTourDetailById(id);
  if (!detail.success || !detail.data) notFound();

  const gpCity = detail.data.googlePlace?.city ?? "";
  const canonicalCity = slugifyForUrl(gpCity);
  if (city !== canonicalCity) {
    redirect(`/tours/${canonicalCity}/${slug}`);
  }

  const heroImage =
    pickDerivedUrl(detail.data.keyPhoto, ["large", "preview", "thumbnail"]) ??
    null;

  const gallery = (detail.data.photos ?? [])
    .map((p) => pickDerivedUrl(p, ["large", "preview", "thumbnail"]))
    .filter((u): u is string => !!u)
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-pearlgray">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 xl:px-0 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Private tour in</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-nightsky">
              {detail.data.googlePlace?.city ?? detail.data.title}
            </h1>
            <p className="text-base text-muted-foreground">
              {detail.data.googlePlace?.country ?? ""}
            </p>
          </div>
          <Button asChild className="bg-nightsky hover:bg-nightsky/90">
            <Link href="#request">Request private tour</Link>
          </Button>
        </div>

        {heroImage && (
          <div className="relative mb-10 h-[260px] w-full overflow-hidden rounded-xl bg-white shadow-sm md:h-[380px]">
            <Image
              src={heroImage}
              alt={detail.data.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {gallery.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.map((url) => (
                <div
                  key={url}
                  className="relative h-28 overflow-hidden rounded-lg bg-white shadow-sm md:h-36"
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-nightsky text-xl">
                  About this private tour
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral max-w-none">
                {detail.data.summary ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: detail.data.summary }}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    Tour description is currently unavailable.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card id="request">
              <CardHeader>
                <CardTitle className="text-nightsky text-xl">
                  Request your tour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TourRequestFormSection
                  cityName={detail.data.googlePlace?.city ?? detail.data.title}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
