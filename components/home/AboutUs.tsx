//import { Card, CardContent } from "@/components/ui/card";
//import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  MapPin,
  Users,
  Sparkles,
  HeartHandshake,
  BadgeCheck,
  LeafyGreen,
} from "lucide-react";

const AboutUs = () => {
  return (
    <section
      aria-labelledby="about-title"
      className="w-full py-16 md:py-24 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 xl:px-0">
        <div className="grid gap-10 xl:grid-cols-2 xl:gap-12">
          {/* Left: Story */}
          <div className="space-y-6">
            <h2
              id="about-title"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Discover the heart of the city with a local guide.
            </h2>
            <p className="text-nightsky text-lg">
              LocalCityWalks connects travellers with local guides for walking
              tours in cities across Europe. They’ll lead you through hidden
              corners, everyday life, and authentic stories you can only get
              from someone who truly calls the city home.
            </p>

            <ul className="grid gap-4 sm:grid-cols-2">
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-orange-50 p-2 text-orange-600">
                  <MapPin className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">Led by locals</p>
                  <p className="text-sm text-nightsky">
                    Walking tours hosted by local guides who know the city best.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-orange-50 p-2 text-orange-600">
                  <Users className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">Small groups</p>
                  <p className="text-sm text-nightsky">
                    Intimate small group tours for a personal, flexible
                    experience.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-orange-50 p-2 text-orange-600">
                  <Sparkles className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">Authentic insights</p>
                  <p className="text-sm text-nightsky">
                    Discover hidden cafés, local history, and authentic city
                    life.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-orange-50 p-2 text-orange-600">
                  <BadgeCheck className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">Trusted & vetted</p>
                  <p className="text-sm text-nightsky">
                    All guides reviewed for quality, safety, and great guest
                    reviews.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-orange-50 p-2 text-orange-600">
                  <HeartHandshake className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">Community-driven</p>
                  <p className="text-sm text-nightsky">
                    Every walk supports local people, places, and businesses.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-orange-50 p-2 text-orange-600">
                  <LeafyGreen className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">Sustainable travel</p>
                  <p className="text-sm text-nightsky">
                    Explore the city on foot for an eco-friendly, slower-paced
                    tour.
                  </p>
                </div>
              </li>
            </ul>
            {/* TODO: Add stats */}
            {/* <div className="flex flex-wrap items-center gap-6 pt-2">
              <div>
                <p className="text-2xl font-semibold">120+</p>
                <p className="text-sm text-nightsky">Cities</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">4.9/5</p>
                <p className="text-sm text-muted-foreground">Avg. rating</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">1,500+</p>
                <p className="text-sm text-muted-foreground">Local guides</p>
              </div>
            </div> */}
          </div>

          {/* Right: Visuals */}
          <div className="flex flex-col gap-6 ">
            <div className="grid grid-cols-3 gap-3">
              <div className="row-span-3 col-span-3 sm:col-span-2 sm:row-span-2 overflow-hidden rounded-lg xl:min-h-[470px]">
                <Image
                  src="/guiding1.jpg"
                  alt="Local guide leading a small group through a neighborhood"
                  width={780}
                  height={520}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg hidden sm:block">
                <Image
                  src="/guiding4.png"
                  alt="Travelers chatting with a local at a cafe"
                  width={380}
                  height={260}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg hidden sm:block">
                <Image
                  src="/guiding2.jpg"
                  alt="Hidden alley with street art discovered on a walk"
                  width={380}
                  height={260}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* TODO: Add join as a guide card */}
            {/*  <Card>
              <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Live here? Become a local guide</p>
                  <p className="text-sm text-muted-foreground">
                    Share your city and earn by hosting thoughtful walks.
                  </p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-600/90">
                  Join as a guide
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
