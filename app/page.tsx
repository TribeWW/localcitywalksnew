export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 ">
      {/* Decorative footsteps background */}
      <div
        className="pointer-events-none select-none absolute bottom-0 right-0 w-2/3 max-w-xl h-2/3 opacity-40 z-[-1]"
        aria-hidden="true"
        style={{
          backgroundImage: "url('/footsteps.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "bottom right",
        }}
      />
      {/* Background gradient */}
      <div className="absolute inset-0 z-[-2] bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,102,0,0.10),rgba(255,255,255,0))]" />

      {/* Content container */}
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Brand Name */}
        <h1 className="text-5xl font-extrabold text-gray-900">
          LocalCity<span className="text-primary">Walks</span>
        </h1>

        {/* Main headline */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          <span className="text-primary">Walk Local.</span> Discover True
          Culture.
        </h2>

        {/* Subtext */}
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Experience your city like never before. Enjoy personalized walking
          tours, tailored to your interests and preferences.
        </p>
      </div>
    </main>
  );
}
