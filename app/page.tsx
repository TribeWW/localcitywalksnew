import ContactForm from "@/components/forms/ContactForm";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <main className="relative items-left justify-center bg-gradient-to-r from-tangerine to-grapefruit">
        {/* Flex container for content and form */}

        <div className="w-full max-w-6xl mx-auto flex flex-col justify-between md:py-8">
          {/* Content container on the left */}
          {/* <div className="flex items-center pt-8 px-4 md:px-8 xl:px-0">
            <Image
              src="/logo.png"
              alt="LocalCityWalks"
              width={300}
              height={300}
              className="h-12 w-auto"
            />
          </div> */}
          <div className="flex flex-col lg:flex-row justify-center gap-12 sm:gap-0 px-4  md:px-8 xl:px-0">
            <div className="w-full lg:w-1/2 flex flex-col items-left space-y-12">
              <div className="space-y-8">
                {/* Brand Name */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white leading-tight mt-8 lg:mt-0">
                  City walking tours led by trusted local guides
                </h1>
                {/* Subtext */}
                <p className="text-xl sm:text-2xl md:text-3xl text-white  mx-auto font-regular ">
                  LocalCityWalks connects you with trusted local guides for
                  personal, insightful city walks.
                </p>
              </div>
              <div className="flex flex-col gap-y-4">
                <div className="flex items-center gap-x-2">
                  <Image
                    src="/check.svg"
                    alt="check"
                    width={24}
                    height={24}
                    className="inline-block"
                  />
                  <p className="text-white font-medium text-lg sm:text-xl md:text-2xl">
                    Vetted local guides
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <Image
                    src="/check.svg"
                    alt="check"
                    width={24}
                    height={24}
                    className="inline-block"
                  />
                  <p className="text-white font-medium text-lg sm:text-xl md:text-2xl">
                    Small groups only
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <Image
                    src="/check.svg"
                    alt="check"
                    width={24}
                    height={24}
                    className="inline-block"
                  />
                  <p className="text-white font-medium text-lg sm:text-xl md:text-2xl">
                    Real local insights
                  </p>
                </div>
              </div>
              {/* Eclipses */}
              <div className="flex items-center ">
                <Image
                  src="/localguides-avatars.png"
                  alt="local guides avatars"
                  width={304}
                  height={80}
                />
              </div>
            </div>
            {/* ContactForm on the right */}
            <div className="w-full lg:w-1/2 flex items-center justify-center md:py-8 xl:py-0">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
