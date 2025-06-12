import ContactForm from "@/components/forms/ContactForm";
import Image from "next/image";

export default function Home() {
  const ellipseImages = [
    "/Ellipse 1.png",
    "/Ellipse 2.png",
    "/Ellipse 3.png",
    "/Ellipse 4.png",
    "/Ellipse 5.png",
  ];
  return (
    <>
      <main className="relative  min-h-screen flex flex-col items-left justify-center px-4 sm:px-6 bg-tangerine">
        {/* Flex container for content and form */}

        <div className="w-full max-w-6xl mx-auto  ">
          {/* Content container on the left */}
          <Image
            src="/logo.png"
            alt="LocalCityWalks"
            width={300}
            height={300}
          />
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-y-12 sm:gap-y-0 sm:gap-x-12 py-12">
            <div className="w-full sm:w-1/2 flex flex-col items-left justify-center  space-y-6 sm:space-y-12">
              {/* Coming Soon badge */}
              <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-tangerine text-white text-base sm:text-lg font-bold tracking-wide"></div>
              {/* Brand Name */}
              <h1 className="text-5xl  font-medium text-white leading-tight">
                City walking tours led by trusted local guides
              </h1>
              {/* Subtext */}
              <p className="text-xl sm:text-2xl md:text-3xl text-white max-w-2xl mx-auto font-regular ">
                LocalCityWalks connects you with trusted local guides for
                personal, insightful city walks.
              </p>
              <div className="flex flex-col gap-y-4">
                <div className="flex items-center gap-x-2">
                  <Image
                    src="/check.svg"
                    alt="check"
                    width={20}
                    height={20}
                    className="inline-block mr-2"
                  />
                  <p className="text-white font-medium text-2xl">
                    Vetted local guides
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <Image
                    src="/check.svg"
                    alt="check"
                    width={20}
                    height={20}
                    className="inline-block mr-2"
                  />
                  <p className="text-white font-medium text-2xl">
                    Small groups only
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <Image
                    src="/check.svg"
                    alt="check"
                    width={20}
                    height={20}
                    className="inline-block mr-2"
                  />
                  <p className="text-white font-medium text-2xl">
                    Real local insights
                  </p>
                </div>
              </div>
              {/* Eclipses */}
              <div className="flex items-center ">
                {ellipseImages.map((src, idx) => (
                  <Image
                    key={src}
                    src={src}
                    alt={`Guide ${idx + 1}`}
                    className={`w-20 h-20 rounded-full  border-white object-cover ${
                      idx !== 0 ? "-ml-8" : ""
                    }`}
                    loading="lazy"
                    width={500}
                    height={500}
                  />
                ))}
              </div>
            </div>
            {/* ContactForm on the right */}
            <div className="w-full sm:w-1/2 flex items-center justify-center ">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
