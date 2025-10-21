import React from "react";
import Image from "next/image";
import { MapPin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-nightsky text-white">
      {/* Main footer content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-8">
          {/* Branding Section */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-long-white.png"
                alt="LocalCityWalks"
                width={200}
                height={50}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-white/80 text-sm max-w-xs">
              City walking tours led by trusted local guides
            </p>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-white/80" />
              <span className="text-white/80 text-sm">
                Palma De Mallorca, Spain
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-white/80" />
              <span className="text-white/80 text-sm">
                hello@localcitywalks.com
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="bg-watermelon py-4 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white text-sm">
            © 2025 LocalCityWalks | Made with ❤️ in Spain
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
