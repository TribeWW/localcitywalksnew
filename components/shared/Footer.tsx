import React from "react";
//import Image from "next/image";
import { NAV_LINKS } from "@/constants";
import Link from "next/link";
//import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-tangerine to-grapefruit  text-white py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className=" flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="">
            {/* <Image
              src={"/logo-long-dark.svg"}
              alt="LocalCityWalks"
              width={200}
              height={100}
            /> */}
            {/* <p>
              LocalCityWalks is a platform for city walking tours led by trusted
              local guides.
            </p> */}
          </div>
          <div className="">
            {/* <div className="font-bold">Pages</div> */}
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="">
            {/* <div className="font-bold">Useful Links</div> */}
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          {/*  <div className="font-bold">Payment Methods</div> */}
        </div>
        {/* <Separator /> */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <div className="text-white">
            Made with ❤️ in Spain from travelers, for travelers
            <span className="text-sm text-white">
              {" "}
              | © 2025 LocalCityWalks - an AMAIA Ventures SL Company
            </span>
          </div>

          <div className=""></div>
        </div>
        {/* <Separator /> */}
      </div>
    </footer>
  );
};

export default Footer;
