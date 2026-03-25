import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full bg-white font-sans">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="rounded-2xl bg-pearl-gray px-6 py-10 md:px-10">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <Image
              src="/logo-long-dark.svg"
              alt="LocalCityWalks"
              width={173}
              height={40}
              className="h-8 w-auto"
              priority={false}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              LocalCityWalks connects you with trusted local guides for
              personal, insightful city walks.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LocalCityWalks. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
