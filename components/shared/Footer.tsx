import Image from "next/image";
import CookieSettingsLink from "@/components/shared/CookieSettingsLink";

const IUBENDA_COOKIE_POLICY_ID = process.env.NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID;

function LegalRow() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="m-0 text-xs text-muted-foreground">
        © {currentYear} LocalCityWalks™. All rights reserved.
      </p>
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <CookieSettingsLink className="iubenda-cs-preferences-link cursor-pointer text-muted-foreground underline-offset-4 hover:underline">
          Cookie settings
        </CookieSettingsLink>
        {IUBENDA_COOKIE_POLICY_ID && (
          <>
            <a
              href={`https://www.iubenda.com/privacy-policy/${IUBENDA_COOKIE_POLICY_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-muted-foreground underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href={`https://www.iubenda.com/privacy-policy/${IUBENDA_COOKIE_POLICY_ID}/cookie-policy`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-muted-foreground underline-offset-4 hover:underline"
            >
              Cookie Policy
            </a>
          </>
        )}
      </div>
    </div>
  );
}

const Footer = () => {
  return (
    <footer className="w-full bg-white font-sans">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-0">
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

        <div className="pt-8">
          <LegalRow />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
