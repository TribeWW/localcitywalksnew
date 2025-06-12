import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LocalCityWalks",
  description:
    "Small group walks led by locals. Real stories, real connections, real cities. Leave nothing but footsteps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.className}>
      <head></head>
      <body className={`${outfit.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
