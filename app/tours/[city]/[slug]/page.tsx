import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, Clock, Globe, Users } from "lucide-react";
import { getTourDetailById } from "@/lib/actions/tour-detail.actions";
import { stripAccents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TourRequestFormSection from "@/components/tours/tour-request-form-section";
import TourImageGallery from "@/components/tours/tour-image-gallery";
import FaqAccordion from "@/components/tours/faq-accordion";

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

function pickBestPhotoUrl(photo: unknown, preferred: string[]): string | null {
  const photoData = photo as {
    originalUrl?: string;
    derived?: Array<{ name?: string; url?: string }>;
  };

  // Prefer original image for fullscreen quality when available.
  if (photoData?.originalUrl) return photoData.originalUrl;

  const derived = photoData?.derived;
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
  if (!detail.success) {
    if (detail.error === "Tour not found") {
      notFound();
    }

    return (
      <main className="min-h-screen bg-pearlgray">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-8 xl:px-0 py-16">
          <h1 className="text-3xl font-semibold text-nightsky">
            We could not load this tour right now
          </h1>
          <p className="mt-3 text-muted-foreground">
            Please try again in a moment. If the issue continues, contact us and
            we will help you plan your private tour.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-nightsky hover:bg-nightsky/90">
              <Link href={`/tours/${city}/${slug}`}>Try again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!detail.data) notFound();

  const gpCity = detail.data.googlePlace?.city ?? "";
  const canonicalCity = slugifyForUrl(gpCity);
  if (city !== canonicalCity) {
    redirect(`/tours/${canonicalCity}/${slug}`);
  }

  const heroImage = pickBestPhotoUrl(detail.data.keyPhoto, [
    "large",
    "preview",
    "thumbnail",
  ]);
  const gallery = (detail.data.photos ?? [])
    .map((p) => pickBestPhotoUrl(p, ["large", "preview", "thumbnail"]))
    .filter((u): u is string => !!u)
    .slice(0, 8);
  const allImages = Array.from(
    new Set([heroImage, ...gallery].filter(Boolean)),
  ) as string[];

  const cityDisplayName = gpCity.trim() || "City";

  const productTitle = detail.data.title;
  const excerpt = detail.data.excerpt?.trim() ?? "";
  const aboutHtml =
    detail.data.description?.trim() || detail.data.summary?.trim() || "" || "";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 xl:px-0 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Breadcrumb>
            <BreadcrumbList className="flex-wrap gap-2 text-xs text-[#6A6A6A] sm:gap-2">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/"
                    className="font-medium text-[#0F172A] no-underline hover:text-[#0F172A]"
                  >
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#D3CED2] [&>svg]:hidden">
                /
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <span className="font-medium text-[#0F172A]">
                  Private tour in {cityDisplayName}
                </span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {allImages.length > 0 ? (
          <TourImageGallery images={allImages} title={productTitle} />
        ) : (
          <section className="mb-10">
            <p className="text-sm text-muted-foreground">
              Images for this tour are currently unavailable.
            </p>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="mb-4 text-[32px] font-bold leading-[1.3] text-[#0F172A]">
                {cityDisplayName}: Private City Walk with a Local Guide
              </h1>
              {excerpt ? (
                <p className="mb-6 text-lg font-normal leading-[1.6] text-[#1A1A1A]">
                  {excerpt}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    icon: <Users size={14} />,
                    text: "Private Tour",
                  },
                  {
                    icon: <Clock size={14} />,
                    text: "2 hours",
                  },
                  {
                    icon: <Globe size={14} />,
                    text: "English, Spanish, French, German",
                  },
                  {
                    icon: <BadgeCheck size={14} className="text-[#16A34A]" />,
                    text: "Free cancellation",
                  },
                ].map((tag, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[#D3CED2] bg-[#F7F7F7] px-2.5 py-1 text-sm font-medium text-[#0F172A]"
                  >
                    {tag.icon}
                    <span>{tag.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {aboutHtml ? (
              <section
                id="about"
                className="mb-12 scroll-mt-28"
                aria-labelledby="about-heading"
              >
                <h2
                  id="about-heading"
                  className="mb-4 text-xl font-semibold text-[#0F172A]"
                >
                  About
                </h2>
                <div
                  className="flex flex-col gap-6 text-base leading-[1.6] text-[#1A1A1A] [&_p]:m-0 [&_p]:!text-[#1A1A1A] [&_p]:text-base [&_p]:leading-[1.6]"
                  dangerouslySetInnerHTML={{ __html: aboutHtml }}
                />
              </section>
            ) : null}

            <section
              className="mb-12 flex items-center gap-6 rounded-lg border-[1.5px] border-[#D3CED2] bg-white p-6"
              aria-labelledby="hello-banner-heading"
            >
              <Image
                src="/hello-image.svg"
                alt="LocalCityWalks badge"
                width={104}
                height={104}
                className="h-[104px] w-[104px] shrink-0 object-contain"
              />
              <div>
                <h3
                  id="hello-banner-heading"
                  className="mb-2 text-base font-semibold text-[#0F172A]"
                >
                  Hello by LocalCityWalks
                </h3>
                <p className="text-sm leading-[1.6] text-[#1A1A1A]">
                  Local-led private walking tours that blend iconic landmarks,
                  hidden local corners and personal stories, bringing the city
                  to life.
                </p>
              </div>
            </section>

            <section className="mb-12" aria-labelledby="good-to-know-heading">
              <h2
                id="good-to-know-heading"
                className="mb-4 text-xl font-semibold text-[#0F172A]"
              >
                Good to know
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-base leading-[1.6] text-[#1A1A1A]">
                <li>Group size limited to 15 for an intimate experience.</li>
                <li>
                  Not suitable for participants with severe mobility
                  restrictions on uneven terrain.
                </li>
                <li>
                  Please inform us of any dietary requirements for the tasting.
                </li>
              </ul>
            </section>

            <section
              className="mb-12"
              aria-labelledby="cancellation-policy-heading"
            >
              <h2
                id="cancellation-policy-heading"
                className="mb-4 text-xl font-semibold text-[#0F172A]"
              >
                Cancellation policy
              </h2>
              <p className="text-base leading-[1.6] text-[#1A1A1A]">
                Receive a full refund if you cancel at least 24 hours before the
                experience starts. No refund if cancelled less than 24 hours
                before the start time.
              </p>
            </section>
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

        <div id="faq" className="scroll-mt-28 pb-20">
          <h2 className="mb-6 text-xl font-semibold text-[#0F172A]">
            Frequently asked questions
          </h2>
          <FaqAccordion
            items={[
              {
                question: "Can I choose a different starting time?",
                answer:
                  "Yes, we offer flexible scheduling. Simply contact us with your preferred time and we'll do our best to accommodate. Most guides can adjust within a 2-hour window of the listed start time.",
              },
              {
                question: "Can I customize the experience?",
                answer:
                  "Absolutely. All our private tours can be tailored to your interests. Let us know what you'd like to focus on — food, history, architecture, hidden gems — and your guide will adapt the route.",
              },
              {
                question:
                  "Can I book for bigger groups than your maximum group size?",
                answer:
                  "Yes! For groups larger than our standard maximum, we can arrange a private tour with one or more dedicated guides. Just send us a message with your group size and we'll put together a custom quote.",
              },
              {
                question:
                  "Can I book in a different language than the ones listed?",
                answer:
                  "We're always expanding our language options. If you don't see your preferred language listed, reach out to us — we may have a guide available or can help find one.",
              },
              {
                question: "Are there any entrance tickets included?",
                answer:
                  'This depends on the specific tour. Some tours include entrance fees (noted in the "What\'s included" section), while others focus on outdoor exploration. Any additional costs are always clearly listed before you book.',
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
