import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

import Script from "next/script";
import { config } from "@/lib/config";
import { SITE_URL, absoluteUrl } from "@/lib/site";

// Environment variables for analytics
const GA4_ID = config.analytics.ga4Id;
const GTM_ID = config.analytics.gtmId;

const IUBENDA_SITE_ID = process.env.NEXT_PUBLIC_IUBENDA_SITE_ID;
const IUBENDA_COOKIE_POLICY_ID =
  process.env.NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID;

/**
 * Third-party scripts (Iubenda, GTM, GA4) load only on the production Vercel
 * deployment — not on preview/staging (NODE_ENV is "production" there too).
 * Set NEXT_PUBLIC_LOAD_TRACKING_SCRIPTS=true to force-enable (e.g. local QA).
 */
const loadThirdPartyScripts =
  process.env.VERCEL_ENV === "production" ||
  process.env.NEXT_PUBLIC_LOAD_TRACKING_SCRIPTS === "true";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Book Guided Walking Tours with Trusted Local Guides - LocalCityWalks",
  description:
    "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title:
      "Book Guided Walking Tours with Trusted Local Guides - LocalCityWalks",
    description:
      "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.",
    url: absoluteUrl("/"),
    type: "website",
    siteName: "LocalCityWalks",
    images: [
      {
        url: absoluteUrl("/guide.png"),
        height: 630,
        alt: "Book Guided Walking Tours with Trusted Local Guides - LocalCityWalks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Book Guided Walking Tours with Trusted Local Guides - LocalCityWalks",
    description:
      "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.",
    images: [absoluteUrl("/guide.png")],
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: {
      url: "/apple-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <head>
        {loadThirdPartyScripts && (
          <Script
            src="https://embeds.iubenda.com/widgets/2eb2fdb3-d356-4f87-b69e-90958c564119.js"
            strategy="beforeInteractive"
          />
        )}
        {loadThirdPartyScripts &&
          IUBENDA_SITE_ID &&
          IUBENDA_COOKIE_POLICY_ID && (
          <>
            <Script id="iubenda-cs-config" strategy="beforeInteractive">
              {`
                var _iub = _iub || [];
                _iub.csConfiguration = _iub.csConfiguration || {};
                _iub.csConfiguration = Object.assign(_iub.csConfiguration, {
                  siteId: Number(${JSON.stringify(IUBENDA_SITE_ID)}),
                  cookiePolicyId: Number(${JSON.stringify(IUBENDA_COOKIE_POLICY_ID)}),
                  lang: "en",
                  floatingPreferencesButtonDisplay: false
                });
              `}
            </Script>
            <Script
              src="https://cdn.iubenda.com/cs/iubenda_cs.js"
              strategy="beforeInteractive"
            />
          </>
        )}
        {/* Google Tag Manager */}
        {loadThirdPartyScripts && GTM_ID && (
          <Script id="google-tag-manager" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
        {/* Google tag (gtag.js) */}
        {loadThirdPartyScripts && GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}');
            `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LocalCityWalks",
              description:
                "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.",
              url: SITE_URL,
              logo: absoluteUrl("/logo-icon.svg"),
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: SITE_URL,
              name: "LocalCityWalks",
            }),
          }}
        />
      </head>
      <body
        className={`${outfit.className} antialiased h-screen min-h-screen bg-white`}
      >
        {/* Google Tag Manager (noscript) */}
        {loadThirdPartyScripts && GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {/* End Google Tag Manager (noscript) */}
        <Navbar />
        {children}
        <Footer />

        <Toaster />
      </body>
    </html>
  );
}
