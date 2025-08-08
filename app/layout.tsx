import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/shared/Header";
import MobileHeader from "@/components/shared/MobileHeader";
import Footer from "@/components/shared/Footer";
import Script from "next/script";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Book Guided Walking Tours with Trusted Local Guides - LocalCityWalks",
  description:
    "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.",
  alternates: {
    canonical: "https://www.localcitywalks.com/",
  },
  openGraph: {
    title:
      "Book Guided Walking Tours with Trusted Local Guides - LocalCityWalks",
    description:
      "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.",
    url: "https://www.localcitywalks.com/",
    type: "website",
    siteName: "LocalCityWalks",
    images: [
      {
        url: "https://www.localcitywalks.com/guide.png",
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
    images: ["https://www.localcitywalks.com/guide.png"],
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
    <html lang="en" className={outfit.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LocalCityWalks",
              description:
                "Discover cities like a local. Small group walking tours led by trusted local guides. Real stories, real connections, real cities.",
              url: "https://www.localcitywalks.com",
              logo: "https://www.localcitywalks.com/logo-icon.svg",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: "https://www.localcitywalks.com",
              name: "LocalCityWalks",
            }),
          }}
        />
      </head>
      {/* Google tag (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-PQC1GK2TFT"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-PQC1GK2TFT');
        `}
      </Script>
      <body
        className={`${outfit.className} antialiased h-screen min-h-screen bg-gradient-to-r from-tangerine to-grapefruit`}
      >
        <Header />
        <MobileHeader />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
