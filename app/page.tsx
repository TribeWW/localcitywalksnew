import ContactForm from "@/components/forms/ContactForm";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <main className="relative h-screen items-left justify-center bg-tangerine">
        {/* Flex container for content and form */}

        <div className="w-full max-w-6xl mx-auto flex flex-col justify-between h-screen py-8">
          {/* Content container on the left */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="LocalCityWalks"
              width={300}
              height={300}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-center ">
            <div className="w-full sm:w-1/2 flex flex-col items-left  space-y-12">
              <div className="space-y-8">
                {/* Brand Name */}
                <h1 className="text-5xl  font-medium text-white leading-tight">
                  City walking tours led by trusted local guides
                </h1>
                {/* Subtext */}
                <p className="text-xl sm:text-2xl md:text-3xl text-white max-w-2xl mx-auto font-regular ">
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
                  <p className="text-white font-medium text-2xl">
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
                  <p className="text-white font-medium text-2xl">
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
                  <p className="text-white font-medium text-2xl">
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
            <div className="w-full sm:w-1/2 flex items-center justify-center ">
              <ContactForm />
            </div>
          </div>
          <div className="text-center text-white text-base">
            © 2025 LocalCityWalks | Made with ❤️ in Spain.
          </div>
        </div>
      </main>
    </>
  );
}
