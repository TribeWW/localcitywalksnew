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
      <div className="max-w-2xl mx-auto text-center space-y-12">
        {/* Coming Soon badge */}
        <div className="inline-block px-6 py-2 rounded-full bg-primary text-white text-lg font-bold tracking-wide mb-4">
          Coming Soon
        </div>
        {/* Brand Name */}
        <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900">
          LocalCity<span className="text-primary">Walks</span>
        </h1>

        {/* Subtext */}
        <p className="text-2xl md:text-3xl text-gray-600 max-w-2xl mx-auto font-medium">
          Small group walks led by locals. Real stories, real connections, real
          cities.
        </p>
        <p className="text-primary font-bold text-xl md:text-2xl">
          Leave nothing but footsteps.
        </p>
      </div>
    </main>
  );
}
