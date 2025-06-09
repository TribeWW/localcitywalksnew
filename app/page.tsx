import AboutUs from "@/components/home/AboutUs";

export default function Home() {
  return (
    <>
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6">
        {/* Decorative footsteps background */}
        <div
          className="pointer-events-none select-none absolute bottom-0 right-0 w-full sm:w-2/3 max-w-xl h-1/2 sm:h-2/3 opacity-30 sm:opacity-40 z-[-1]"
          aria-hidden="true"
          style={{
            backgroundImage: "url('/footsteps.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            backgroundPosition: "bottom right",
          }}
        />
        {/* Content container */}
        <div className="w-full max-w-2xl mx-auto text-center space-y-6 sm:space-y-12">
          {/* Coming Soon badge */}
          <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-primary text-white text-base sm:text-lg font-bold tracking-wide">
            Coming Soon
          </div>
          {/* Brand Name */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight">
            LocalCity<span className="text-primary">Walks</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Small group walks led by locals. Real stories, real connections,
            real cities.
          </p>
          <p className="text-primary font-bold text-lg sm:text-xl md:text-2xl">
            Leave nothing but footsteps.
          </p>
        </div>
      </main>
      <AboutUs />
    </>
  );
}
