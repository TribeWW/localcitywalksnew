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
        {/* Coming Soon badge */}
        <div className="inline-block px-4 py-1 rounded-full bg-primary text-white text-sm font-semibold tracking-wide mb-2">
          Coming Soon
        </div>
        {/* Brand Name */}
        <h1 className="text-5xl font-extrabold text-gray-900">
          LocalCity<span className="text-primary">Walks</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Small group walks led by locals. Real stories, real connections, real
          cities.
        </p>
        <p className="text-primary font-semibold">
          Leave nothing but footsteps.
        </p>
      </div>
    </main>
  );
}
