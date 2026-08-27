import Image from "next/image";
import CookieSettingsLink from "@/components/shared/CookieSettingsLink";
import FooterCityLinks from "./FooterCityLinks";

const IUBENDA_COOKIE_POLICY_ID =
  process.env.NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID;

function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:justify-end">
      <a
        href="/docs/LocalCityWalks_TermsAndConditions_EN.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer text-muted-foreground underline-offset-4 hover:underline"
      >
        Terms and Conditions
      </a>
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
  );
}

function LegalRow() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mx-auto flex flex-col flex-wrap items-center justify-center gap-4 text-center md:flex-row md:justify-between md:text-left">
      <p className="m-0 text-xs text-muted-foreground">
        © {currentYear} LocalCityWalks™. All rights reserved.
      </p>
      <LegalLinks />
    </div>
  );
}

interface FooterProps {
  variant?: "full" | "minimal";
}

const Footer = ({ variant = "full" }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  if (variant === "minimal") {
    return (
      <footer className="border-t border-border bg-white font-sans">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <p className="m-0 text-xs text-muted-foreground">
              © {currentYear} LocalCityWalks™. All rights reserved.
            </p>
            <LegalLinks />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-white font-sans">
      <div className="mx-auto max-w-6xl px-6 py-6 md:px-0">
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
        <div className="py-8">
          <FooterCityLinks />
        </div>
        <div className="">
          <LegalRow />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
