import type { Metadata } from "next";
import {
  ReviewMarquee,
  type ReviewMarqueeProps,
} from "@/components/reviews-mockup/ReviewMarquee";
import { TourDetailReviewsSectionMock } from "@/components/reviews-mockup/TourDetailReviewsSectionMock";

export const metadata: Metadata = {
  title: "Reviews section mockup",
  description:
    "Temporary design preview for the reviews marquee — not linked from production nav.",
  robots: { index: false, follow: false },
};

const MOCK_ROW1: ReviewMarqueeProps["row1"] = [
  {
    name: "Sarah M.",
    location: "United Kingdom",
    date: "Tour date: Mar 12, 2025",
    rating: 5,
    text: "Our guide made Biarritz come alive—history, food tips, and a calm pace. Best introduction we could have asked for.",
  },
  {
    name: "Thomas K.",
    location: "Germany",
    date: "Tour date: Feb 3, 2025",
    rating: 4,
    text: "Small group feel even as a private walk. Clear meeting point and reliable communication before the day.",
  },
  {
    name: "Elena R.",
    location: "Italy",
    date: "Tour date: Jan 18, 2025",
    rating: 5,
    text: "We loved the local perspective—places we would never have found on our own. Highly recommend for first-timers.",
  },
  {
    name: "James P.",
    location: "Ireland",
    date: "Tour date: Dec 8, 2024",
    rating: 5,
    text: "Friendly, knowledgeable, and flexible when we wanted a photo stop. Felt like walking with a local friend.",
  },
];

const MOCK_ROW2: ReviewMarqueeProps["row2"] = [
  {
    name: "Marie D.",
    location: "France",
    date: "Tour date: Mar 1, 2025",
    rating: 4,
    text: "Great overview of the city center and practical advice for the rest of our trip.",
  },
  {
    name: "Chris L.",
    location: "United States",
    date: "Tour date: Feb 22, 2025",
    rating: 5,
    text: "Exactly the low-stress start we needed after a long flight. The pacing was perfect.",
  },
  {
    name: "Ana S.",
    location: "Spain",
    date: "Tour date: Feb 9, 2025",
    rating: 5,
    text: "Warm welcome and genuine recommendations—no tourist-trap filler.",
  },
  {
    name: "David W.",
    location: "Netherlands",
    date: "Tour date: Jan 4, 2025",
    rating: 4,
    text: "Clear storytelling and room for questions. Would book another city with the same format.",
  },
];

export default function ReviewsMockupPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-border bg-pearl-gray px-4 py-3 text-center text-sm text-muted-foreground">
        Mockup only — preview at{" "}
        <span className="font-mono text-foreground">/preview/reviews-mockup</span>
      </div>
      <ReviewMarquee
        title="What travelers say"
        row1={MOCK_ROW1}
        row2={MOCK_ROW2}
      />
      <div className="mx-auto max-w-5xl px-4 pb-16">
        <TourDetailReviewsSectionMock />
      </div>
    </main>
  );
}
